# Propuesta: Contexto Inventario (stock y kardex)

> Estado: **propuesta**. Primer contexto con dominio rico (ADR-02).

## Intención

El stock hoy se escribe desde tres lugares sin reglas comunes:

- El CRUD de productos (`producto.service.ts:134,194`) lo pisa con cualquier valor.
- `crearPedido` lo descuenta sin transacción, sin bloqueo y sin dejar rastro (`pedido.service.ts:94-117`).
- El kardex lo modifica en transacción, pero su "AJUSTE" reemplaza el stock por el valor de `cantidad`, una semántica ambigua (`kardex.service.ts:81-86`).

Resultado: puede sobrevender y el kardex no coincide con el stock real. Este change hace de `inventario` el **único dueño** de `Producto.stock`: todo cambio es un movimiento registrado, atómico y con bloqueo.

## ¿Cambia comportamiento observable?

Sí:

- `POST/PUT /api/products` dejan de aceptar `stock`. El stock inicial de un producto nuevo se registra como movimiento `ENTRADA` con motivo "Stock inicial". En `GestionProducto`, el campo stock pasa a ser de solo lectura, con una acción "Ajustar stock" que abre el formulario del kardex.
- El `AJUSTE` se vuelve explícito: se envía el `stockObjetivo` y el sistema registra la diferencia, con signo, como movimiento.
- El stock nunca queda negativo. Una salida mayor al disponible responde `409`.

## Alcance

### Incluido

- `modules/inventario/domain`: `ExistenciaProducto` (agregado: `productoId`, `stock`), `Movimiento` (`ENTRADA`, `SALIDA`, `AJUSTE`, `RESERVA_PEDIDO`, `LIBERACION_PEDIDO`), `Cantidad` (value object, entero > 0) y errores (`StockInsuficiente`).
- `application`: `RegistrarMovimiento`, `ReservarStock(pedidoId, lineas, uow)` y `LiberarStock(pedidoId, uow)`. Los dos últimos están pensados para que `ventas` los llame **dentro de su transacción**.
- `infrastructure`: `KardexEntity` (misma tabla `Kardex`), repositorio con `SELECT … FOR UPDATE` sobre las filas de `Producto`, y lectura de stock para `catalogo`.
- `http`: las rutas `/api/kardex` actuales con esquemas Zod y la matriz de `hardening-seguridad`.
- Front: `features/admin/kardex/` (pantalla actual migrada) y la acción "Ajustar stock" en productos.
- Migración: ninguna de esquema esperada. Si el `AJUSTE` necesita una columna de signo, se agrega aquí.

### Excluido

- Que los pedidos usen la reserva: lo conecta `contexto-ventas`, el siguiente change.
- Múltiples almacenes o stock por tienda (fuera de alcance; anotar si `Tienda` lo necesitará).

## Capacidades

### Modificadas

- `inventario`: el stock solo cambia por movimientos; reserva y liberación atómicas con bloqueo.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Datos actuales donde `Kardex` y `Producto.stock` no coinciden | Script de conciliación que reporta las diferencias y, con aprobación MANUAL, registra un `AJUSTE` de apertura por producto |
| Bloqueos largos en horas pico | La transacción solo bloquea los productos del pedido, en orden de id (evita deadlocks), y se mide en el test de concurrencia |

## Dependencias

- `core-backend` (`UnitOfWork`, errores, plantilla de módulo núcleo) y `migraciones-bd`.

## Decisiones abiertas

- Forma del `AJUSTE` en la API: `stockObjetivo` (recomendado: es lo que el usuario ve en el conteo físico) o una diferencia con signo.

## Criterios de éxito

- [ ] `grep` en todo el backend: solo `modules/inventario` escribe `stock`.
- [ ] Test de concurrencia: dos reservas simultáneas por la última unidad → una pasa y la otra recibe `StockInsuficiente`.
- [ ] Tests unitarios del dominio sin base de datos.
- [ ] El reporte de conciliación da 0 diferencias después del ajuste de apertura.
