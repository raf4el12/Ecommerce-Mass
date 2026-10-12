# Propuesta: Contexto Pagos (MercadoPago)

> Estado: **propuesta**. Dominio rico (ADR-02).

## Intención

Después de `hardening-seguridad` los pagos ya no se pueden manipular, pero la lógica sigue repartida en dos archivos de rutas (`payments.mp.ts` con 265 líneas y `payments.webhook.ts`), sin registro propio de los pagos y con un formulario de tarjeta en el checkout que pide número y CVV y nunca los usa (`Step2Payment.jsx:148-176`). Este change modela el pago como entidad con su propio ciclo de vida, aísla MercadoPago detrás de un puerto y deja un rastro auditable de cada notificación.

## ¿Cambia comportamiento observable?

Sí:

- **Se elimina el formulario de tarjeta del checkout:** el cobro ocurre en MercadoPago. Deja de existir en el front cualquier dato de tarjeta (sale del alcance PCI).
- **Nueva tabla `Pago`:** un registro por pago del proveedor (`paymentId` único, pedido, monto, moneda, estado, `status_detail`, notificaciones recibidas). La idempotencia pasa a garantizarla la base.
- Los endpoints `/api/payments/mp/*` mantienen sus rutas y contratos, tal como quedaron tras `hardening-seguridad`.

## Alcance

### Incluido

- `modules/pagos/domain`: `Pago` (agregado: `PENDIENTE → APROBADO | RECHAZADO | REEMBOLSADO`), `Monto` (reutiliza `Dinero` del kernel compartido; ver decisión abierta), y el puerto `PasarelaPagos` (`crearPreferencia`, `obtenerPago` y `verificarFirma`).
- `application`: `IniciarPago(pedidoId, usuario)`, `ProcesarNotificacion(evento)` (llama a `ventas.api.confirmarPago`/`rechazarPago`) y `ConsultarPago`.
- `infrastructure`: `MercadoPagoPasarela` (SDK), `PagoEntity`, repositorio y migración de la tabla `Pago`.
- `http`: `payments.routes.ts` (las mismas URLs) y webhook.
- `MetodoPago`: CRUD (comisión, activo) en este módulo; `pagos.api.comisionDe(metodoPagoId)` para `ventas`.
- Front: `features/checkout/pago/` (botón o redirect de MercadoPago, páginas `success`/`failure`/`pending` con `CheckoutSuccess` y `CheckoutPending` migrados) y `features/admin/metodos-pago/`.

### Excluido

- Reembolsos desde el admin (se modela el estado; la acción queda para después).
- Pagos manuales o en efectivo (decisión abierta).

## Capacidades

### Modificadas

- `pagos`: ciclo de vida del pago registrado e idempotente, y proveedor detrás de un puerto.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Notificaciones que llegan antes de que exista el `Pago` | `ProcesarNotificacion` crea el `Pago` si no existe (*upsert* por `paymentId`) |
| Pedidos ya pagados sin registro `Pago` | Backfill opcional desde la API de MercadoPago para los pedidos `COMPLETADO` existentes (script con `--dry-run`) |

## Dependencias

- `contexto-ventas` (`confirmarPago`/`rechazarPago`).

## Decisiones abiertas

- **Checkout Pro (redirect, como hoy) vs Bricks (embebido):** recomendado mantener Checkout Pro, que es más simple y deja fuera del alcance PCI.
- **¿Hace falta registrar pagos manuales** (efectivo o transferencia en tienda)? Si sí, se agrega un `PagoManual` con auditoría (quién, cuándo, comprobante) y permiso `PEDIDOS:UPDATE`.
- **`Dinero` compartido entre `ventas` y `pagos`:** moverlo a `src/core/domain/` como shared kernel, o duplicarlo. Recomendado: shared kernel, porque es un value object estable.

## Criterios de éxito

- [ ] `grep -rn "cvv\|numeroTarjeta" TiendasMassFront-main/src/features/checkout` → 0.
- [ ] Recibir la misma notificación 3 veces produce 1 registro `Pago` y 1 confirmación del pedido (test).
- [ ] Ningún archivo fuera de `modules/pagos/infrastructure` importa el SDK `mercadopago`.
