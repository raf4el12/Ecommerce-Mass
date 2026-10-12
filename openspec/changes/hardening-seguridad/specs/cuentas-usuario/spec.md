# Cuentas de usuario — Especificación (delta)

## Propósito

El registro público nunca otorga privilegios, y ninguna respuesta expone credenciales.

## ADDED Requirements

### Requirement: Registro público sin privilegios

`POST /api/usuarios/register` MUST crear siempre el usuario con el rol de cliente y el estado activo, y MUST ignorar `rolId` y `estadoId` del body. El rol de cliente se identifica por nombre exacto `cliente` (sin distinguir mayúsculas). Si no existe, el endpoint MUST responder `500` y registrar el error de configuración.

#### Scenario: USR.1 — Intento de registrarse como admin

- GIVEN el body de un registro válido con `rolId: 1` y `estadoId: 2`
- WHEN se hace `POST /api/usuarios/register`
- THEN el usuario creado tiene rol `cliente` y estado activo

### Requirement: Alta administrativa

`POST /api/usuarios` MUST exigir `USUARIOS:CREATE` y MAY aceptar `rolId` y `estadoId`. Solo un superadmin MAY asignar un rol con `esSuperAdmin = true`.

#### Scenario: USR.2 — Alta sin permiso

- GIVEN que no hay token
- WHEN se hace `POST /api/usuarios` con `rolId: 1`
- THEN la respuesta es `401`

#### Scenario: USR.3 — Empleado intenta crear un superadmin

- GIVEN un usuario con `USUARIOS:CREATE` que no es superadmin
- WHEN crea un usuario con un `rolId` cuyo rol es superadmin
- THEN la respuesta es `403`

### Requirement: Sin credenciales en las respuestas

La columna `Usuario.password` MUST tener `select: false`. Ninguna respuesta MUST contener la clave `password`, en ningún nivel de anidamiento (incluidas relaciones como `pedido.usuario`).

#### Scenario: USR.4 — Listado de usuarios

- GIVEN un superadmin autenticado
- WHEN hace `GET /api/usuarios`
- THEN ningún elemento contiene `password`

#### Scenario: USR.5 — Relaciones anidadas

- GIVEN un pedido existente
- WHEN un usuario con `PEDIDOS:READ` hace `GET /api/pedidos/<id>`
- THEN `usuario` no contiene `password`

### Requirement: Setup inicial atómico

`POST /api/setup/create-admin` MUST crear el primer administrador solo si no existe ningún usuario, verificándolo dentro de la misma transacción que la inserción. El rol que crea o reutiliza MUST quedar con `esSuperAdmin = true`.

#### Scenario: USR.6 — Setup con usuarios existentes

- GIVEN que existe al menos un usuario
- WHEN se llama a `POST /api/setup/create-admin`
- THEN la respuesta es `403`, igual que hoy

#### Scenario: USR.7 — Primer admin es superadmin

- GIVEN una base sin usuarios
- WHEN se llama a `POST /api/setup/create-admin` con datos válidos
- THEN el rol del usuario creado tiene `esSuperAdmin = true`
