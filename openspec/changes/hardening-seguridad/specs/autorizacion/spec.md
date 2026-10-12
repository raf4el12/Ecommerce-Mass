# Autorización — Especificación (delta)

## Propósito

Toda ruta tiene un nivel de acceso explícito: público, autenticado, dueño del recurso o permiso de módulo. El superadmin se identifica por un dato explícito, no por el nombre del rol.

## ADDED Requirements

### Requirement: Matriz de acceso explícita

Cada ruta de la API MUST declarar uno de estos niveles: **público**, **autenticado** (`authenticate`), **dueño** (`authenticate` + el recurso pertenece a `req.user.id`, o el usuario tiene el permiso de lectura/escritura del módulo) o **permiso** (`authenticate` + `authorize(modulo, accion)`). La matriz vigente es la de `design.md` §3. Sin token, las rutas no públicas MUST responder `401`; con token pero sin acceso, MUST responder `403`.

#### Scenario: AUTHZ.1 — Mutación de catálogo sin token

- GIVEN que no hay token
- WHEN se hace `POST /api/products`, `PUT /api/categorias/1` o `DELETE /api/subcategorias/1`
- THEN cada respuesta es `401`
- AND la base de datos no cambia

#### Scenario: AUTHZ.2 — Cliente sin permiso de admin

- GIVEN un cliente autenticado sin permisos de módulo
- WHEN hace `GET /api/usuarios`, `GET /api/pedidos`, `GET /api/dashboard/estadisticas` o `POST /api/kardex`
- THEN cada respuesta es `403`

#### Scenario: AUTHZ.3 — Empleado con permiso puntual

- GIVEN un usuario cuyo rol tiene solo `PRODUCTOS:UPDATE`
- WHEN hace `PUT /api/products/5` con datos válidos
- THEN la respuesta es `200`
- AND `DELETE /api/products/5` responde `403`

#### Scenario: AUTHZ.4 — Lectura pública del catálogo

- GIVEN que no hay token
- WHEN se hace `GET` a `/api/products`, `/api/categorias`, `/api/subcategorias`, `/api/tiendas/activas`, `/api/metodos-pago`, `/api/metodos-envio` o `/api/tipos-cliente`
- THEN cada respuesta es `200`, igual que hoy

### Requirement: Recursos del dueño

En las rutas de direcciones, tarjetas, pedidos de un usuario, pedido por id, `clientes/me` y la edición del propio perfil, el usuario MUST salir de `req.user.id`. Cualquier `usuarioId` en params o body MUST ignorarse, o MUST coincidir con `req.user.id` (si no, `403`), salvo que el usuario tenga el permiso del módulo correspondiente.

#### Scenario: AUTHZ.5 — Direcciones ajenas

- GIVEN el cliente A autenticado y una dirección con id 10 del cliente B
- WHEN A hace `GET /api/direcciones/10`, `PUT /api/direcciones/10` o `GET /api/direcciones/usuario/<idB>`
- THEN cada respuesta es `403`

#### Scenario: AUTHZ.6 — Crear dirección para otro

- GIVEN el cliente A autenticado
- WHEN hace `POST /api/direcciones` con `usuarioId` de B
- THEN la dirección se crea con el usuario A

#### Scenario: AUTHZ.7 — Perfil propio

- GIVEN un cliente autenticado sin permisos de módulo
- WHEN hace `GET /api/clientes/me` y `PUT /api/usuarios/update/<su id>` con `{ telefono }`
- THEN ambas respuestas son `200` (hoy fallan)

#### Scenario: AUTHZ.8 — Auto-escalada en el perfil

- GIVEN un cliente autenticado
- WHEN hace `PUT /api/usuarios/update/<su id>` con `{ rolId: 1, estadoId: 1 }`
- THEN la respuesta es `403`
- AND su rol y su estado no cambian

### Requirement: Superadmin explícito

Un rol MUST ser superadmin solo si `Rol.esSuperAdmin = true`. El superadmin MUST tener acceso a toda ruta con permiso de módulo, y `GET /api/permisos/me/modulos` MUST devolverle todos los módulos. El nombre del rol MUST NOT intervenir en ninguna decisión de acceso.

#### Scenario: AUTHZ.9 — Nombre engañoso

- GIVEN un rol llamado `"Administrativo"` con `esSuperAdmin = false` y sin permisos
- WHEN un usuario con ese rol hace `GET /api/usuarios`
- THEN la respuesta es `403` (hoy pasaría como admin)

#### Scenario: AUTHZ.10 — Superadmin

- GIVEN un rol con `esSuperAdmin = true` y sin filas en `RolPermiso`
- WHEN un usuario con ese rol hace `DELETE /api/tiendas/3`
- THEN la respuesta es `200`

### Requirement: Módulos KARDEX y ROLES

`AdminModulo` MUST incluir `KARDEX` y `ROLES`. Las rutas de kardex MUST usar `KARDEX`; las de roles y permisos MUST usar `ROLES`. `GET /api/roles` MUST aceptar `USUARIOS:READ` o `ROLES:READ`. El script de migración MUST otorgar `KARDEX:<acción>` a cada rol que tenga `PRODUCTOS:<acción>`, y `ROLES:<acción>` a cada rol que tenga `MASTER_TABLE:<acción>`.

#### Scenario: AUTHZ.11 — Sin pérdida de acceso al migrar

- GIVEN un rol con `PRODUCTOS:READ` y `PRODUCTOS:CREATE` antes del deploy
- WHEN se ejecuta el script de migración de permisos
- THEN el rol también tiene `KARDEX:READ` y `KARDEX:CREATE`
- AND su usuario puede hacer `GET /api/kardex` y `POST /api/kardex`

#### Scenario: AUTHZ.12 — Kardex con el usuario del token

- GIVEN un usuario con `KARDEX:CREATE`
- WHEN hace `POST /api/kardex` con `usuario_id` de otro usuario
- THEN el movimiento queda registrado con el usuario del token
