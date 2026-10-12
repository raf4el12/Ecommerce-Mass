# Pedidos — Especificación (delta)

## Propósito

Un pedido siempre pertenece al usuario autenticado que lo crea, y solo su dueño o personal con permiso puede verlo o modificarlo. El estado de pago no se puede cambiar desde la API pública.

## ADDED Requirements

### Requirement: Comprador desde el token

`POST /api/pedidos` MUST exigir autenticación y MUST usar `req.user.id` como comprador. Cualquier `usuarioId` del body MUST ignorarse.

#### Scenario: PED.1 — Pedido a nombre de otro

- GIVEN el cliente A autenticado
- WHEN crea un pedido con `usuarioId` de B
- THEN el pedido queda asociado a A

#### Scenario: PED.2 — Pedido anónimo

- GIVEN que no hay token
- WHEN se hace `POST /api/pedidos`
- THEN la respuesta es `401`

### Requirement: Acceso a pedidos

`GET /api/pedidos/:id` MUST permitir el acceso al dueño o a quien tenga `PEDIDOS:READ`. `GET /api/pedidos/usuario/:usuarioId` MUST permitirlo si `usuarioId === req.user.id` o con `PEDIDOS:READ`. `GET /api/pedidos` y `GET /api/pedidos/estadisticas` MUST exigir `PEDIDOS:READ`. `PUT /api/pedidos/:id` MUST exigir `PEDIDOS:UPDATE` y `DELETE`, `PEDIDOS:DELETE`.

#### Scenario: PED.3 — Pedido ajeno

- GIVEN el cliente A y un pedido de B
- WHEN A hace `GET /api/pedidos/<id de B>`
- THEN la respuesta es `403`

#### Scenario: PED.4 — Seguimiento propio (polling del checkout)

- GIVEN el cliente A y su pedido recién creado
- WHEN A hace `GET /api/pedidos/<su id>`
- THEN la respuesta es `200` con la misma forma que hoy

## REMOVED Requirements

### Requirement: Cambio manual del estado de pago

`PATCH /api/pedidos/:id/estado-pago` y `POST /api/pedidos/pagar` MUST NOT existir. El estado de pago solo cambia por la confirmación de MercadoPago (ver `pagos`). El front no los usa (verificado con grep).

#### Scenario: PED.5 — Intento de marcar como pagado

- GIVEN un pedido `PENDIENTE`
- WHEN se llama a `PATCH /api/pedidos/<id>/estado-pago` con `{ estadoPago: "COMPLETADO" }` o a `POST /api/pedidos/pagar`
- THEN la respuesta es `404`
- AND el pedido sigue `PENDIENTE`
