# Propuesta: Hardening de seguridad (autenticación, autorización, pedidos y pagos)

## Intención

Cerrar los huecos que hoy permiten tomar el control del sistema o del dinero sin credenciales:

- Cualquiera puede registrarse como administrador (`rolId` del body). Incluso sin manipular nada, el valor por defecto `rolId = 2` corresponde a **Almacenero** en una base creada con `npm run seed` (orden: Administrador, Almacenero, Vendedor, Cliente), así que todo cliente nuevo recibe permisos de catálogo.
- `GET /api/usuarios` es público y devuelve los hashes de password.
- El password solo se valida en el cliente: `otp/solicitar` pide únicamente el email y, sin `NODE_ENV=production`, devuelve el código en la respuesta.
- El CRUD de productos, categorías, pedidos, estados, tiendas, métodos, kardex, master-table y dashboard no tiene autenticación.
- Un pedido se puede marcar como pagado con un `PATCH` o un `POST` públicos, o pagando con el precio que el cliente elija.
- `/confirm` le devuelve a un usuario el pedido de otro.
- Hay XSS almacenado en la impresión de pedidos del admin.

Además unifica la autenticación en un solo flujo y un solo middleware, lo que arregla dos bugs funcionales: `/api/clientes/me` falla con el token que guarda el front, y un cliente no puede editar su propio perfil.

## ¿Cambia comportamiento observable?

**Sí, a propósito.** Es el único change del roadmap cuyo objetivo es cambiar comportamiento. Resumen (la matriz completa está en `design.md` §3):

| Área | Hoy | Después |
|---|---|---|
| Login | `POST /usuarios/login` (token sin OTP) + `POST /auth/otp/solicitar` (solo email) + `verificar` (email+código) | `POST /auth/login` (password → envía el OTP → `challenge`) + `POST /auth/otp/verificar` (`challenge`+código). `POST /auth/otp/reenviar`. **Se eliminan** `/usuarios/login` y `/auth/otp/solicitar` |
| Login de admin | `POST /auth/admin/login` emite el token sin OTP | Mismo flujo con OTP (ADR-14, reversible) |
| Mensajes de login | 404 "Usuario no encontrado" / 401 "Contraseña incorrecta" | 401 "Credenciales inválidas" en ambos casos (no revela qué emails existen) |
| Token | Dos payloads (`{userId}` y `{id}`) | Uno solo: `{ sub, rol, typ: "access" }`, RS256, 24 h (igual que hoy) |
| Rutas | La mayoría sin auth | Lectura pública solo para el catálogo y la información de la tienda; todo lo demás exige token, y las rutas del admin exigen permiso |
| Recursos propios | Direcciones, tarjetas y pedidos de cualquier usuario se acceden por id | Solo los del dueño (o con permiso del módulo) |
| Registro | Acepta `rolId`/`estadoId` | `POST /usuarios/register` fuerza rol cliente y estado activo. El alta con rol pasa a `POST /usuarios` (permiso `USUARIOS:CREATE`) |
| Superadmin | Rol cuyo nombre contiene "admin" | Columna `Rol.esSuperAdmin` |
| Módulos | Sin `KARDEX` ni `ROLES` (el kardex usa `PRODUCTOS` y permisos usa `MASTER_TABLE`) | Se agregan `KARDEX` y `ROLES`; se migran los permisos existentes para no quitarle acceso a nadie |
| Pagos | `PATCH /pedidos/:id/estado-pago` y `POST /pedidos/pagar` públicos; preferencia con `items` del body; `/confirm` busca "el último pagado" | Los dos endpoints **se eliminan**. La preferencia se arma desde el pedido. `/confirm` exige token y ser el dueño. El webhook verifica el monto |
| Pedido | `usuarioId` del body | Usuario del token |
| Diagnóstico | `GET /api/diagnostics` público, con mensajes de error internos | **Se elimina** (`/health` cubre la disponibilidad) |
| Impresión de pedidos | HTML sin escapar | Todo valor interpolado se escapa |

## Alcance

### Incluido

- `src/core/auth/{tokens,authenticate,authorize}.ts`. Se borran `verificarToken.ts`, `requirePermiso.ts`, `requireAdmin.ts` y `adminAuth.middleware.ts`.
- Flujo de login con challenge, OTP con `crypto.randomInt`, `codigoDev` solo en `development` y rate limit en login/OTP.
- Aplicación de la matriz de rutas a todos los routers.
- `Rol.esSuperAdmin`, módulos `KARDEX`/`ROLES` y script de datos para migrar los permisos existentes.
- `Usuario.password` con `select: false`; respuestas sin password.
- Pedidos y pagos: `usuario` del token, preferencia desde el pedido, `/confirm` seguro, verificación de monto e idempotencia en el webhook, endpoints inseguros eliminados.
- Frontend: flujo de login con `challenge` (tienda y admin), alta de usuarios del admin vía `POST /usuarios`, `menuConfig` con `KARDEX`/`ROLES` y escape en `ReportesPedidos`.
- Tests de integración para cada escenario del spec.

### Excluido

- Mover código a `src/modules/` (lo harán los changes de contexto). Los controllers legacy se tocan lo mínimo.
- Refresh tokens, cookies `httpOnly` o sacar el token de `localStorage` (se evalúa en `contexto-identidad`).
- Estado del usuario como enum (`contexto-identidad`). Tarjetas y PCI (`contexto-clientes`). Transaccionalidad de pedidos y stock (`contexto-ventas`).

## Capacidades

### Nuevas

- `autenticacion`: un flujo de login con OTP y un token de acceso.
- `autorizacion`: permisos por módulo/acción, superadmin explícito y control de dueño.
- `cuentas-usuario`: registro público seguro, alta administrativa y respuestas sin password.
- `pedidos`: identidad del comprador desde el token y acceso restringido.
- `pagos`: montos desde el servidor y confirmación verificable.
- `panel-admin`: salida HTML segura.

## Enfoque

1. **Primero el núcleo de auth** (`core/auth/*`) con tests unitarios y de integración. Todavía no se aplica a las rutas.
2. **Flujo de login nuevo** en backend y frontend, en el mismo PR y con deploy coordinado.
3. **Matriz de rutas**, router por router, cada uno con sus tests de "sin token → 401 / sin permiso → 403 / con permiso → 2xx".
4. **Pagos y pedidos**.
5. **Limpieza**: borrar los middlewares viejos y los endpoints eliminados, y aplicar el escape XSS.

## Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `src/core/auth/` | Nuevo | `tokens`, `authenticate`, `authorize` |
| `src/middlewares/{verificarToken,requirePermiso,requireAdmin,adminAuth.middleware}.ts` | Borrado | Reemplazados |
| `src/controllers/{auth,usuarios,permisos,cliente,direccion,tarjeta-usuario,pedido,kardex,setup}.controller.ts`, `pagarpedio.controller.ts` (borrado) | Modificado | Usuario del token; sin password en respuestas |
| `src/routes/*.routes.ts`, `src/routes/payments.{mp,webhook}.ts` | Modificado | Matriz de rutas, pagos |
| `src/services/{otp,pedido}.service.ts` | Modificado | OTP seguro; usuario por parámetro |
| `src/entities/{Rol,Permiso,Usuario}.entity.ts` | Modificado | `esSuperAdmin`, módulos nuevos, `select: false` |
| `scripts/migrar-permisos-hardening.ts` | Nuevo | Datos: superadmin y permisos `KARDEX`/`ROLES` |
| Front: `features/auth/api.ts`, `LoginForm`, `OTPVerificationForm`, `AdminLogin`, `GestionUsuarios`, `menuConfig.js`, `features/checkout/api.ts`, `CheckoutSuccess`, `ReportesPedidos` | Modificado | Flujo de login nuevo, alta admin, pagos, XSS |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Se protege una ruta que una pantalla usa sin sesión y la pantalla se rompe | Media | La matriz se armó cruzando cada ruta con sus consumidores en el front. Verificación manual por pantalla en `tasks.md`. Requiere que `sesion-y-cliente-http` ya esté desplegado |
| Un usuario pierde acceso a kardex o permisos al crear los módulos nuevos | Media | Script que otorga `KARDEX:*` a los roles con `PRODUCTOS:*` y `ROLES:*` a los roles con `MASTER_TABLE:*` (el mapeo de hoy en el menú). Se corre antes del deploy y se revisa su salida |
| Un rol que hoy es "admin" por su nombre deja de serlo | Media | El script marca `esSuperAdmin` en los roles cuyo nombre es exactamente `admin`/`administrador` y **lista** los demás que contienen "admin" para que el usuario decida (tarea MANUAL) |
| El front y el back se despliegan desfasados y el login falla unos minutos | Media | Deploy coordinado: el backend primero y el front inmediatamente después. Ventana de mantenimiento corta, comunicada |
| La preferencia de MP no suma exacto por redondeo | Baja | La línea de ajuste se calcula como diferencia en céntimos enteros (`design.md` §6) |
| Tokens emitidos antes del deploy (payload `{userId}`/`{id}`) | Alta (esperado) | Se rechazan con 401 y el usuario vuelve a iniciar sesión. Comportamiento declarado |

## Plan de rollback

1. Revertir los PRs en orden inverso. No hay migraciones de esquema destructivas: `esSuperAdmin` y los valores nuevos del enum son aditivos y el código anterior los ignora.
2. Si solo falla el OTP del admin (ADR-14), se revierte únicamente esa decisión: `adminLogin` vuelve a emitir el token directo.
3. El script de permisos es aditivo (solo inserta `RolPermiso`); su salida guarda los ids insertados para poder borrarlos.

## Dependencias

- `estabilizar-base`: `env.ts`, `createApp()` e infraestructura de tests.
- `sesion-y-cliente-http`: el front ya envía el token en todas las requests y tiene `features/*/api.ts`.

## Criterios de éxito

- [ ] Todas las filas de la matriz (`design.md` §3) tienen un test de integración que pasa.
- [ ] `POST /api/usuarios/register` con `rolId: 1` crea un usuario con rol cliente.
- [ ] Ninguna respuesta de la API contiene la clave `password` (test que recorre los endpoints de usuarios y auth).
- [ ] No hay forma de llegar a `estadoPago = COMPLETADO` sin un pago aprobado por MercadoPago por el monto del pedido.
- [ ] El login de la tienda y el del admin funcionan de punta a punta con OTP.
- [ ] `/api/clientes/me` y la edición del propio perfil funcionan para un cliente.
- [ ] `grep -rn "includes(\"admin\")\|includes('admin')" src` → 0 en el backend.
