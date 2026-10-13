# Cliente HTTP — Especificación (delta)

## Propósito

Toda comunicación del frontend con la API pasa por un único cliente, configurado por entorno, que adjunta la sesión y normaliza los errores.

## ADDED Requirements

### Requirement: Base URL desde el entorno

El cliente MUST construir su base URL como `${VITE_API_URL}/api`. En desarrollo (`import.meta.env.DEV`), si `VITE_API_URL` no está definida, MAY usar `http://localhost:5001`. En un build de producción sin `VITE_API_URL`, el módulo MUST lanzar un error al cargarse.

#### Scenario: HTTP.1 — Request a la URL configurada

- GIVEN `VITE_API_URL=https://api.ejemplo.pe`
- WHEN se llama a `api.get('/products')`
- THEN la request va a `https://api.ejemplo.pe/api/products`

#### Scenario: HTTP.2 — Build de producción sin configuración

- GIVEN un build de producción sin `VITE_API_URL`
- WHEN se carga la app
- THEN `src/shared/api/client.ts` lanza `Error("VITE_API_URL no está definida")`

### Requirement: Token automático

Si hay sesión, el cliente MUST adjuntar `Authorization: Bearer <token>` a cada request. Si no hay sesión, MUST NOT enviar el header. Ningún componente SHOULD armar headers de autorización a mano.

#### Scenario: HTTP.3 — Con sesión

- GIVEN una sesión con token `abc`
- WHEN se hace cualquier request
- THEN lleva `Authorization: Bearer abc`

#### Scenario: HTTP.4 — Sin sesión

- GIVEN que no hay sesión
- WHEN se hace cualquier request
- THEN no lleva header `Authorization`

### Requirement: Manejo de 401

Ante un `401` en una request que **llevó** token, el cliente MUST cerrar la sesión y redirigir a `/admin/login` si la ruta actual empieza con `/admin`, o a `/login` en otro caso. Ante un `401` en una request **sin** token, MUST solo rechazar la promesa.

> Nota: hasta `hardening-seguridad`, el backend responde `403` a los tokens vencidos (`verificarToken.ts:20`), así que este comportamiento se verifica con msw y empieza a actuar contra la API real con `hardening-seguridad`.

#### Scenario: HTTP.5 — Token vencido en el admin

- GIVEN una sesión activa
- AND la ruta actual es `/admin/productos`
- WHEN una request responde `401`
- THEN la sesión queda vacía
- AND el navegador va a `/admin/login`

#### Scenario: HTTP.6 — Credenciales inválidas en el login

- GIVEN que no hay sesión
- WHEN el login responde `401`
- THEN la promesa se rechaza con el mensaje del backend
- AND no hay redirección

### Requirement: Errores normalizados

El cliente MUST rechazar con un `ApiError { status, message, details? }`. Toma `message` de `data.message`; si no existe, de `data.error`; si tampoco existe, usa un mensaje genérico según el status.

#### Scenario: HTTP.7 — Formatos de error del backend actual

- GIVEN respuestas `400 { error: "Email requerido" }` y `400 { message: "Email requerido" }`
- WHEN cada una se rechaza
- THEN en ambos casos `ApiError.message === "Email requerido"` y `status === 400`

#### Scenario: HTTP.8 — Error de red

- GIVEN que el backend no responde
- WHEN se hace una request
- THEN se rechaza con `status: 0` y `message: "No se pudo conectar con el servidor"`

### Requirement: URLs de archivos estáticos

Las URLs de imágenes y archivos del backend MUST construirse con `assetUrl(path)`:

- Si `path` es relativa, devuelve `${VITE_API_URL}/${path}` (sin barra duplicada).
- Si es absoluta y empieza con `http://localhost:3000` o `http://localhost:5001` (datos legacy en la DB), reemplaza ese origen por `VITE_API_URL`.
- Cualquier otra URL absoluta se devuelve sin cambios.

#### Scenario: HTTP.9 — Ruta relativa

- GIVEN `VITE_API_URL=https://api.ejemplo.pe`
- WHEN `assetUrl('uploads/productos/a.jpg')`
- THEN devuelve `https://api.ejemplo.pe/uploads/productos/a.jpg`

#### Scenario: HTTP.10 — URL legacy

- GIVEN `VITE_API_URL=https://api.ejemplo.pe`
- WHEN `assetUrl('http://localhost:3000/uploads/a.jpg')`
- THEN devuelve `https://api.ejemplo.pe/uploads/a.jpg`

### Requirement: Sin llamadas directas

Fuera de `src/shared/api/`, el código de `src/` MUST NOT contener `fetch(` ni URLs `localhost:<puerto>`, ni importar `axios`. `src/shared/api/` queda exento porque contiene el fallback de desarrollo de `client.ts` y los orígenes legacy de `assetUrl`. El CI MUST verificarlo.

#### Scenario: HTTP.11 — Barrera en CI

- GIVEN un PR que agrega `fetch('http://localhost:5001/api/x')` en un componente
- WHEN corre `frontend.yml`
- THEN el job `verify` falla en el paso "sin llamadas HTTP directas"
