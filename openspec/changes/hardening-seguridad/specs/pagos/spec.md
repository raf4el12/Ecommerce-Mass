# Pagos — Especificación (delta)

## Propósito

Lo que se cobra en MercadoPago sale del pedido guardado, y un pedido solo pasa a pagado cuando MercadoPago confirma un pago aprobado por su monto.

## ADDED Requirements

### Requirement: Preferencia desde el pedido

`POST /api/payments/mp/preference` MUST exigir autenticación y recibir solo `{ orderId }`. Si el pedido no es de `req.user.id`, MUST responder `403`; si su `estadoPago` no es `PENDIENTE`, `409`. Los `items` MUST construirse desde la base: una línea por detalle (`producto.nombre`, `cantidad`, `detalle.precio`) más una línea de ajuste ("Envío, impuestos y comisión") calculada en céntimos enteros, de modo que la suma sea exactamente `pedido.montoTotal`. El email del pagador MUST tomarse del usuario, no del body.

#### Scenario: PAG.1 — Precio manipulado

- GIVEN el pedido de A con `montoTotal = 150.00`
- WHEN A pide una preferencia enviando `items: [{ unit_price: 0.01, quantity: 1 }]`
- THEN la preferencia enviada a MercadoPago suma `150.00`
- AND los `items` del body se ignoran

#### Scenario: PAG.2 — Preferencia de un pedido ajeno

- GIVEN el cliente A y un pedido de B
- WHEN A pide una preferencia con `orderId` de B
- THEN la respuesta es `403`

#### Scenario: PAG.3 — Suma exacta con decimales

- GIVEN un pedido de 3 unidades a `10.33`, envío `7.90`, impuesto y comisión según las reglas actuales
- WHEN se construyen los `items`
- THEN `Σ (unit_price × quantity)` es igual a `montoTotal` al céntimo

### Requirement: Webhook verificable e idempotente

El webhook MUST consultar el pago a la API de MercadoPago, como hoy. MUST marcar `COMPLETADO` solo si el pago está `approved`, la moneda es `PEN` y `transaction_amount` coincide con `montoTotal` (tolerancia ±0.01). Si no coincide, MUST dejar el pedido sin cambios y registrar un warning. Si el pedido ya está `COMPLETADO`, MUST NOT cambiarlo. Si `MP_WEBHOOK_SECRET` está configurado, MUST validar la firma `x-signature` y rechazar las notificaciones inválidas.

#### Scenario: PAG.4 — Pago por menos

- GIVEN un pedido de `150.00`
- AND un pago aprobado en MercadoPago por `0.01` con `external_reference` de ese pedido
- WHEN llega la notificación
- THEN el pedido sigue `PENDIENTE`
- AND queda un warning en el log con `orderId`, `paymentId` y ambos montos

#### Scenario: PAG.5 — Pago correcto

- GIVEN un pedido de `150.00` y un pago aprobado por `150.00` en `PEN`
- WHEN llega la notificación
- THEN el pedido pasa a `COMPLETADO`

#### Scenario: PAG.6 — Notificación repetida

- GIVEN un pedido `COMPLETADO`
- WHEN llega otra notificación del mismo pago, o una de un pago `rejected`
- THEN el pedido sigue `COMPLETADO`

### Requirement: Confirmación del dueño

`POST /api/payments/mp/confirm` MUST exigir autenticación y aceptar `{ paymentId?, orderId? }`. Con `paymentId`, MUST consultar MercadoPago y verificar que el `external_reference` sea un pedido de `req.user.id`. Con solo `orderId`, MUST devolver el estado actual de ese pedido si es del usuario. MUST NOT buscar pedidos por estado sin filtrar por id y dueño.

#### Scenario: PAG.7 — Ya no se filtran pedidos ajenos

- GIVEN el cliente A sin pedidos pagados y un pedido `COMPLETADO` de B
- WHEN A llama a `/confirm` con un `preferenceId` cualquiera
- THEN la respuesta es `400` (falta `paymentId` u `orderId`)
- AND no contiene el id del pedido de B

#### Scenario: PAG.8 — Confirmación propia

- GIVEN el cliente A, su pedido 12 y el `payment_id` aprobado que MercadoPago devolvió en la redirección
- WHEN A llama a `/confirm` con `{ paymentId }`
- THEN la respuesta incluye `orderId: 12` y `statusMp: "approved"`
