# Autenticación — Especificación (delta)

## Propósito

Un único flujo de inicio de sesión (password + OTP por email) para clientes y administradores, que emite un único tipo de token de acceso.

## ADDED Requirements

### Requirement: Login en dos pasos con challenge

`POST /api/auth/login` MUST validar email y password y verificar que el usuario esté activo. Recién entonces MUST generar y enviar un OTP, y responder `200 { requiresOTP: true, challenge, expiresIn }`. El `challenge` es un JWT RS256 con `typ: "otp-challenge"`, `sub` = id del usuario y vencimiento de 10 minutos. Ante un email inexistente o un password incorrecto MUST responder `401 { message: "Credenciales inválidas" }`, con el mismo cuerpo en ambos casos.

#### Scenario: AUTH.1 — Credenciales válidas

- GIVEN un usuario activo con email `ana@x.pe` y password `Secreta123`
- WHEN hace `POST /api/auth/login` con esas credenciales
- THEN la respuesta es `200` con `requiresOTP: true` y un `challenge`
- AND se envió un OTP a `ana@x.pe`
- AND la respuesta no contiene datos del usuario ni el token de acceso

#### Scenario: AUTH.2 — Password incorrecto y email inexistente

- GIVEN el usuario de AUTH.1
- WHEN hace login con password `Otra` y, por separado, con el email `nadie@x.pe`
- THEN ambas respuestas son `401 { message: "Credenciales inválidas" }`
- AND no se envía ningún OTP

#### Scenario: AUTH.3 — Usuario inactivo

- GIVEN un usuario con estado distinto de activo y password correcto
- WHEN hace login
- THEN la respuesta es `403 { message: "Usuario inactivo o suspendido" }`

### Requirement: Verificación de OTP

`POST /api/auth/otp/verificar` MUST recibir `{ challenge, codigo }`. Si el challenge es válido y el código coincide con el OTP vigente del usuario, MUST responder `200 { token, usuario, expiresIn: "24h" }`. El `usuario` tiene la misma forma que hoy y **sin** `password`. Cada código fallido MUST contar como intento; con 5 intentos el OTP MUST invalidarse.

#### Scenario: AUTH.4 — Código correcto

- GIVEN un `challenge` de AUTH.1 y el OTP enviado
- WHEN hace `POST /api/auth/otp/verificar` con ambos
- THEN la respuesta es `200` con `token` y `usuario`
- AND el token decodificado tiene `sub` = id del usuario, `typ: "access"` y `rol`

#### Scenario: AUTH.5 — Sin challenge no hay token

- GIVEN el email de un usuario y un OTP válido, pero sin `challenge`
- WHEN hace `POST /api/auth/otp/verificar` con `{ email, codigo }` (el formato de hoy)
- THEN la respuesta es `400`

#### Scenario: AUTH.6 — Fuerza bruta

- GIVEN un `challenge` válido
- WHEN se envían 5 códigos incorrectos y después el correcto
- THEN la sexta respuesta es `401`
- AND hace falta un nuevo login para obtener otro OTP

#### Scenario: AUTH.7 — Challenge vencido o adulterado

- GIVEN un `challenge` vencido, o uno firmado con otra llave, o un token de acceso usado como challenge
- WHEN se verifica un OTP con él
- THEN la respuesta es `401`

### Requirement: Endpoints de login legacy eliminados

`POST /api/usuarios/login` y `POST /api/auth/otp/solicitar` MUST NOT existir. `POST /api/auth/admin/login` MUST comportarse igual que `POST /api/auth/login` (ADR-14).

#### Scenario: AUTH.8 — Login sin OTP

- GIVEN credenciales válidas
- WHEN se llama a `POST /api/usuarios/login`
- THEN la respuesta es `404`

#### Scenario: AUTH.9 — Admin con OTP

- GIVEN un superadmin con credenciales válidas
- WHEN hace `POST /api/auth/admin/login`
- THEN la respuesta es la de AUTH.1 (challenge, sin token)

### Requirement: Reenvío de OTP

`POST /api/auth/otp/reenviar { challenge }` MUST generar un OTP nuevo, invalidar el anterior y enviarlo al usuario del challenge.

#### Scenario: AUTH.10 — Reenvío

- GIVEN un `challenge` válido y un OTP vigente
- WHEN se llama a `reenviar`
- THEN el OTP anterior deja de ser válido y el nuevo funciona en `verificar`

### Requirement: Generación y exposición del OTP

El OTP MUST generarse con `crypto.randomInt(100000, 1000000)`. El campo `codigoDev` MUST incluirse en la respuesta solo si `NODE_ENV === "development"`.

#### Scenario: AUTH.11 — Sin código en test ni en producción

- GIVEN `NODE_ENV` igual a `production` o a `test`
- WHEN se hace login
- THEN la respuesta no contiene `codigoDev`

### Requirement: Límite de intentos

`/api/auth/login`, `/api/auth/admin/login` y `/api/auth/otp/*` MUST limitarse a 10 requests por IP cada 15 minutos. Al superarlo, MUST responder `429`.

#### Scenario: AUTH.12 — Rate limit

- GIVEN 10 requests a `/api/auth/login` desde la misma IP en 15 minutos
- WHEN llega la undécima
- THEN la respuesta es `429`

### Requirement: Token de acceso único

Todo token de acceso MUST ser RS256 con payload `{ sub, rol, typ: "access" }` y vencimiento de 24 h. `authenticate` MUST verificarlo con `algorithms: ["RS256"]` y exigir `typ === "access"`. Además MUST cargar el usuario de la DB y rechazar con `401` si no existe o no está activo. Debe dejar `req.user = { id, email, rol: { id, nombre, esSuperAdmin }, permisos }`.

#### Scenario: AUTH.13 — Token de un formato anterior

- GIVEN un token RS256 válido con payload `{ userId: 1 }` (formato anterior)
- WHEN se usa en una ruta autenticada
- THEN la respuesta es `401`

#### Scenario: AUTH.14 — Usuario desactivado con token vigente

- GIVEN un token de acceso válido de un usuario que luego fue desactivado
- WHEN se usa en una ruta autenticada
- THEN la respuesta es `401`

#### Scenario: AUTH.15 — HS256 con secreto conocido

- GIVEN un token HS256 firmado con `"tu_secreto_jwt"` y `{ sub: "1", typ: "access" }`
- WHEN se usa en cualquier ruta, incluida `POST /api/roles`
- THEN la respuesta es `401`
