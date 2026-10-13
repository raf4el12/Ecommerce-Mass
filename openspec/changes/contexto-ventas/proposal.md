# Propuesta: Contexto Ventas (pedidos)

> Estado: **propuesta**. Dominio rico (ADR-02, ADR-05).

## Intención

Convertir el pedido en un agregado con reglas propias. Hoy el pedido:

- se arma en un service de 225 líneas sin transacción (el propio código lo reconoce: "Usar query runner para transacciones sería ideal aquí en el futuro", `pedido.service.ts:102`);
- calcula montos con `toFixed` sobre floats;
- aplica un impuesto fijo del 8 %;
- acepta cualquier cambio de estado desde el admin (`PUT /api/pedidos/:id`).

El objetivo es que crear, confirmar y cancelar un pedido sean operaciones atómicas que respeten el stock (vía `inventario`) y una máquina de estados explícita.

## ¿Cambia comportamiento observable?

Sí:

- **Creación transaccional:** si algo falla, no queda un pedido a medias ni stock descontado. Cada línea genera su movimiento de kardex (`RESERVA_PEDIDO`, referencia = id del pedido).
- **Transiciones válidas solamente:** `PENDIENTE → CONFIRMADO → ENVIADO → ENTREGADO`, y `CANCELADO` desde `PENDIENTE` o `CONFIRMADO` (liberando el stock). Una transición inválida responde `409`.
- **Montos en céntimos enteros** (`Dinero`). Puede cambiar el redondeo en algún caso de borde, que se documenta en el spec.
- **Impuestos configurables** (`PoliticaImpuestos`): tasa y modo (incluido en el precio o sumado) desde configuración, no desde el código.

## Alcance

### Incluido

- `modules/ventas/domain`: `Pedido` (agregado: líneas, totales y transiciones), `LineaPedido`, `Dinero`, `EstadoPedido`, `PoliticaImpuestos` y errores.
- `application`: `CrearPedido` (en una transacción: precios por el puerto `PreciosCatalogo`, comisión por el puerto `ComisionesPago`, `inventario.reservarStock`, persistencia), `CambiarEstadoPedido`, `CancelarPedido` (con `inventario.liberarStock`), `ConfirmarPagoPedido` y `RechazarPagoPedido` (para `pagos`), y consultas (`PedidoPorId`, `PedidosDeUsuario`, `ListarPedidos`).
- `infrastructure`: `PedidoEntity` y `DetallePedidoEntity` (mismas tablas), `MetodoEnvioEntity`, repositorio y mappers. También los **adaptadores legacy** de `PreciosCatalogo` y `ComisionesPago`, que leen `Producto` y `MetodoPago` con TypeORM. `catalogo` (change 12) y `pagos` (change 9) migran después que `ventas`; cuando expongan su `api`, solo se reemplaza el adaptador en `buildVentas`.
- `http`: las rutas `/api/pedidos` vigentes (tras `hardening-seguridad`) con Zod, y `/api/metodos-envio`.
- Front: `features/checkout/` (carrito → pedido) y `features/admin/pedidos/` (`ReportesPedidos` partido en listado, detalle, impresión y exportación CSV).

### Excluido

- MercadoPago y el estado de pago (`contexto-pagos`). Aquí solo se exponen `confirmarPago`/`rechazarPago`.
- El dashboard (`reportes` en `contextos-crud`).

## Capacidades

### Modificadas

- `pedidos`: creación atómica, máquina de estados, montos exactos e impuestos configurables.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Cambian los totales de pedidos nuevos al corregir el impuesto | La decisión es del negocio (abajo). Los pedidos existentes no se recalculan |
| Pedidos históricos con estados que la máquina considera inválidos | La máquina valida transiciones nuevas; los estados existentes se aceptan como punto de partida |

## Dependencias

- `contexto-inventario` (reserva y liberación) y `core-backend`.
- **No** depende de `contexto-pagos` ni de `contextos-crud`: usa puertos con adaptadores legacy (ver Alcance).

## Decisiones abiertas (del negocio, bloquean el spec)

1. **Impuesto:** ¿el 8 % es intencional? En Perú el IGV es 18 % y en retail normalmente **ya está incluido** en el precio mostrado. Hay que definir la tasa y si se suma o se desglosa.
2. **Pedidos con pago fallido:** ¿quedan `PENDIENTE` para reintentar, o se cancelan automáticamente (liberando stock) después de N horas?
3. **Comisión del método de pago:** ¿se le cobra al cliente (como hoy) o la absorbe la tienda?

## Criterios de éxito

- [ ] Test: un fallo en mitad de `CrearPedido` no deja ni pedido ni movimiento de stock.
- [ ] Test: dos pedidos concurrentes por la última unidad → uno se crea y el otro recibe `409`.
- [ ] Tests unitarios de `Pedido`, `Dinero` y `PoliticaImpuestos` sin base de datos.
- [ ] `PUT /api/pedidos/:id` con una transición inválida → `409`.
