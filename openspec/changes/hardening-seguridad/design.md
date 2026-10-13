# Diseño: Hardening de seguridad

## Enfoque técnico

Toda la autenticación y la autorización se concentran en `src/core/auth/`: `tokens`, `authenticate` y `authorize`. Los routers legacy pasan a declarar su nivel de acceso con esos middlewares según la matriz de §3. Los controllers solo cambian lo necesario: el usuario sale de `req.user`, se eliminan endpoints y las respuestas dejan de incluir el password. Los pagos se corrigen en sus dos archivos de rutas (`payments.mp.ts` y `payments.webhook.ts`). El frontend adapta el login al challenge y el alta de usuarios del admin, y escapa el HTML de impresión.

Este change **no** reorganiza el código en `src/modules/`. Lo nuevo va en `src/core/auth/`, que es su ubicación final.

## Decisiones

| Decisión | Elegida | Alternativas | Rationale |
|---|---|---|---|
| Ligar password y OTP | `challenge` = JWT RS256 de 10 min con `typ: "otp-challenge"` | Guardar el challenge en la tabla OTP; sesión en el servidor | Sin estado nuevo en la DB; reutiliza las llaves existentes; `typ` impide usarlo como token de acceso y viceversa |
| Payload del token de acceso | `{ sub, rol, typ: "access" }` | Mantener `userId` | `sub` es el estándar. Los tokens viejos dejan de servir, y eso se declara. `rol` es solo informativo: la autorización siempre consulta la DB |
| `authenticate` consulta la DB | Sí: una query por request (usuario + rol + permisos) | Confiar solo en el token | Un usuario desactivado o con permisos revocados pierde el acceso al instante (AUTH.14); el costo es una query por PK |
| Superadmin | Columna `Rol.esSuperAdmin boolean default false` | Rol con id fijo; nombre exacto | Explícito, editable solo por un superadmin (AUTHZ.13) y sin depender de ids ni de textos |
| Transición del payload del token | WU2 cambia el payload a `{ sub, … }`; el `verificarToken` legacy agrega `userId` e `id` a partir de `sub` hasta que WU3 pase todas las rutas a `authenticate` y WU5 lo borre | Cambiar payload y middlewares en el mismo PR | Sin el shim, `requirePermiso`, `requireAdmin` y `permisos.controller` leen `userId` y responden 401 con los tokens nuevos: la verificación de WU2 sería imposible |
| Dueño del recurso | Helper `requireSelfOr(modulo, accion, getOwnerId)` + verificación en el controller cuando el dueño sale de la DB | Políticas genéricas (CASL) | Son 5 recursos; un helper alcanza (sin abstracciones preventivas) |
| Endpoints de pago inseguros | **Eliminar** (`PATCH estado-pago`, `POST pagar`) | Protegerlos con `PEDIDOS:UPDATE` | El front no los usa (grep) y su existencia contradice ADR-15. Si el admin necesitara marcar pagos manuales (p. ej. efectivo en tienda), se diseña en `contexto-pagos` con auditoría |
| Línea de ajuste en la preferencia de MP | Ítems reales + una línea "Envío, impuestos y comisión" calculada como diferencia en céntimos | Un único ítem "Pedido #N"; prorratear | El comprador ve sus productos en MercadoPago y la suma es exacta por construcción |
| Rate limit | `express-rate-limit` en memoria, 10 req/15 min por IP, configurable con `AUTH_RATE_LIMIT`. El limitador se crea con `crearRateLimit(max)` dentro de `createApp()`, no al cargar el módulo | Redis; por email | Hay una sola instancia en Azure. Si se escala horizontalmente, se cambia el store. Crearlo en `createApp` permite que cada test fije su propio límite |
| IP del cliente | `app.set('trust proxy', env.TRUST_PROXY)` (por defecto `false`; `1` en Azure) | Sin configurar | Detrás del proxy de Azure, `req.ip` sería la IP del proxy y todos compartirían el límite. express-rate-limit ≥ 7 además reporta `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`. Verificar en Azure si `X-Forwarded-For` incluye el puerto (`ip:puerto`); si lo incluye, usar un `keyGenerator` que lo quite |
| `GET /api/diagnostics` | Eliminar | Protegerlo | Duplica `/health` y expone `error.message` interno |

## 1. `src/core/auth/tokens.ts`

```ts
type AccessClaims    = { sub: string; rol: string; typ: 'access' };
type ChallengeClaims = { sub: string; typ: 'otp-challenge' };

export function firmarAccessToken(usuario: { id: number; rol: { nombre: string } }): string;   // 24h
export function firmarChallenge(usuarioId: number): string;                                   // 10m
export function verificarAccessToken(token: string): AccessClaims;      // algorithms: ['RS256'], typ === 'access'
export function verificarChallenge(token: string): ChallengeClaims;     // algorithms: ['RS256'], typ === 'otp-challenge'
```

Las llaves salen de `env.jwt` (`estabilizar-base`). Ningún otro archivo importa `jsonwebtoken`.

## 2. `authenticate` y `authorize`

```ts
// src/core/types/express.d.ts
declare global { namespace Express { interface Request {
  user?: { id: number; email: string; rol: { id: number; nombre: string; esSuperAdmin: boolean }; permisos: Set<string> }  // 'MODULO:ACCION'
}}}

// src/core/auth/authenticate.ts
export const authenticate: RequestHandler          // Bearer → verificarAccessToken → 1 query (usuario+estado+rol+rolPermisos.permiso)
                                                   // inexistente / inactivo → 401 (AUTH.13, AUTH.14, AUTH.15)
// src/core/auth/authorize.ts
export function authorize(...alternativas: [AdminModulo, AdminAccion][]): RequestHandler
  // superadmin → next; alguna alternativa ∈ req.user.permisos → next; si no → 403
export function requireSelfOr(modulo: AdminModulo, accion: AdminAccion, ownerId: (req) => number | undefined): RequestHandler
  // ownerId(req) === req.user.id || tiene permiso → next; si no → 403
export function puede(user, modulo, accion): boolean   // para controllers que conocen al dueño después de leer la DB
export const requireSuperAdmin: RequestHandler          // para POST /api/permisos/seed
```

- `authorize(...)` siempre va después de `authenticate`.
- `requireSelfOr` cubre los casos con el dueño en la URL (`/usuario/:usuarioId`, `/update/:id`). Para `/:id` de direcciones, tarjetas y pedidos, el controller lee el recurso y usa `puede()` o compara `recurso.usuarioId === req.user.id`.
- `GET /api/permisos/me/modulos` usa `req.user`: si es superadmin, todos los módulos; si no, los de `req.user.permisos`.
- **Anti-escalada (AUTHZ.13):** `permisos.controller.reemplazarPermisosRol` y `asignarRol`, y `usuarios` (`update` y `crearUsuarioAdmin`), leen el rol destino y responden 403 si el rol es superadmin y `req.user` no lo es. Lo mismo si el rol destino es el propio rol de `req.user`, o si el usuario destino es `req.user` cambiando su rol.
- **Shim de transición (solo WU2 a WU4):** `middlewares/verificarToken.ts` hace `decoded.userId ??= Number(decoded.sub); decoded.id ??= Number(decoded.sub)`. Se borra en WU5 junto con el archivo.

## 3. Matriz de rutas

Leyenda: **P** = público · **A** = autenticado · **D(M:X)** = dueño o permiso `M:X` · **M:X** = permiso · ~~tachado~~ = eliminado.

| Ruta | Hoy | Después | Consumidor en el front |
|---|---|---|---|
| `POST /api/auth/login` | P (no envía OTP) | P + rate limit; envía OTP y devuelve `challenge` | `LoginForm` |
| `POST /api/auth/admin/login` | P (token sin OTP) | P + rate limit; igual que `/auth/login` | `AdminLogin` |
| `POST /api/auth/otp/solicitar` | P (solo email) | ~~eliminado~~ | `LoginForm` (se quita) |
| `POST /api/auth/otp/reenviar` | — | P + rate limit (`{ challenge }`) | `OTPVerificationForm` |
| `POST /api/auth/otp/verificar` | P (`{email,codigo}`) | P + rate limit (`{ challenge, codigo }`) | `OTPVerificationForm` |
| `GET /api/auth/verify` | P (verifica a mano) | A | — |
| `POST /api/usuarios/login` | P (token sin OTP) | ~~eliminado~~ | `LoginForm` (se quita) |
| `POST /api/usuarios/register` | P (acepta `rolId`) | P; rol cliente + estado activo forzados | `RegisterForm` |
| `POST /api/usuarios` | P (alias de register) | `USUARIOS:CREATE`; rol superadmin solo por superadmin (USR.3) | `CrearAdmin`, `GestionUsuarios` |
| `GET /api/usuarios` | P (con hashes) | `USUARIOS:READ` | `GestionUsuarios` |
| `GET /api/usuarios/:id` | P | D(`USUARIOS:READ`) | `Perfil`, `userContext` |
| `PUT /api/usuarios/update/:id` | `USUARIOS:UPDATE` | D(`USUARIOS:UPDATE`); `rolId`/`estadoId` solo con el permiso; rol superadmin o el propio rol: solo superadmin (AUTHZ.13) | `profile`, `GestionUsuarios` |
| `DELETE /api/usuarios/delete/:id` | `USUARIOS:DELETE` | `USUARIOS:DELETE` | `GestionUsuarios` |
| `GET /api/roles`, `/:id` | P | `USUARIOS:READ` o `ROLES:READ` | `GestionUsuarios`, `CrearAdmin`, `GestionPermisos` |
| `POST/PUT/DELETE /api/roles` | adminAuth (HS256, roto) | `ROLES:CREATE/UPDATE/DELETE` | `GestionPermisos` |
| `GET /api/permisos/me/modulos` | verificarToken | A | `usePermisos` |
| `GET /api/permisos/catalogo`, `/roles/:roleId` | requireAdmin | `ROLES:READ` | `GestionPermisos` |
| `PUT /api/permisos/roles/:roleId` | requireAdmin | `ROLES:UPDATE` + AUTHZ.13 | `GestionPermisos` |
| `PATCH /api/permisos/usuarios/:id/rol` | requireAdmin | `ROLES:UPDATE` + AUTHZ.13 | `GestionPermisos` |
| `POST /api/permisos/seed` | requireAdmin | `requireSuperAdmin` | — |
| `GET /api/products`, `/:id`, `POST /bulk` | P | P | catálogo |
| `POST/PUT/DELETE /api/products` | P | `PRODUCTOS:CREATE/UPDATE/DELETE` | `GestionProducto` |
| `GET /api/categorias`, `/:id` | P | P | catálogo |
| `POST/PUT/DELETE /api/categorias` | P | `CATEGORIAS:*` | `GestionCategorias` |
| `GET /api/subcategorias/*` | P | P | catálogo |
| `POST/PUT/DELETE /api/subcategorias` | P | `SUBCATEGORIAS:*` | `GestionSubcategorias` |
| `GET /api/tiendas`, `/activas`, `/:id` | P | P | `Tiendas`, `GestionTienda` |
| `POST/PUT/DELETE /api/tiendas` | P | `TIENDAS:*` | `GestionTienda` |
| `GET /api/metodos-pago`, `/:id` | P | P | checkout |
| `POST/PUT/DELETE /api/metodos-pago` | P | `METODO_PAGO:*` | `GestionMetodoPago` |
| `GET /api/metodos-envio`, `/:id` | P | P | checkout |
| `POST/PUT/DELETE /api/metodos-envio` | P | `METODO_ENVIO:*` | — |
| `GET /api/tipos-cliente` | P | P | `RegisterForm` |
| `GET /api/estados`, `/:id` | P | `ESTADOS:READ` | `GestionEstados` |
| `POST/PUT/DELETE /api/estados`, `PUT /orden/actualizar` | P | `ESTADOS:CREATE/UPDATE/DELETE` (orden → `UPDATE`) | `GestionEstados` |
| `/api/master-table` (todo) | P | `MASTER_TABLE:READ/CREATE/UPDATE/DELETE` | `useMasterTable` |
| `GET /api/dashboard/estadisticas` | P | `DASHBOARD:READ` | `Dashboard` |
| `GET /api/kardex`, `/producto/:id` | P | `KARDEX:READ` | `GestionKardex` |
| `POST /api/kardex` | P (`usuario_id` del body) | `KARDEX:CREATE`; usuario del token | `GestionKardex` |
| `POST /api/pedidos` | P (`usuarioId` del body) | A; comprador = token | checkout |
| `GET /api/pedidos`, `/estadisticas` | P | `PEDIDOS:READ` | `ReportesPedidos` |
| `GET /api/pedidos/usuario/:usuarioId` | P | D(`PEDIDOS:READ`) | `orders` |
| `GET /api/pedidos/:id` | P | D(`PEDIDOS:READ`) | `paymentService` (polling) |
| `PUT /api/pedidos/:id` | P | `PEDIDOS:UPDATE` | `ReportesPedidos` |
| `DELETE /api/pedidos/:id` | P | `PEDIDOS:DELETE` | — |
| `POST /api/pedidos/pagar` | P (marca pagado) | ~~eliminado~~ | — |
| `PATCH /api/pedidos/:id/estado-pago` | P | ~~eliminado~~ | — |
| `/api/direcciones/*` (6 rutas) | P por id | A + dueño (crear con el usuario del token) | `direccion`, checkout |
| `/api/tarjetas-usuario/*` (5 rutas) | P por id | A + dueño | `metodopago`, checkout |
| `GET/PUT /api/clientes/me` | verificarToken (lee `payload.id`: roto) | A (`req.user.id`) | `profile` |
| `POST /api/payments/mp/preference` | P (`items` del body) | A + dueño; ítems desde el pedido (§6) | `paymentService` |
| `POST /api/payments/mp/confirm` | P ("último pagado") | A + dueño (§6) | `CheckoutSuccess` |
| `GET/POST /api/payments/mp/webhook` | P | P + verificación de monto, idempotencia y firma opcional | MercadoPago |
| `GET /api/payments/mp/{success,failure,pending,auto-redirect}`, `/preference/health` | P | P | MercadoPago (redirecciones) |
| `GET /api/setup/status`, `POST /api/setup/create-admin` | P | P (create-admin atómico, rol superadmin) | `AdminRoute`, `SetupAdmin` |
| `GET /api/diagnostics` | P | ~~eliminado~~ | — |
| `GET /`, `GET /health` | P | P | monitoreo |

## 4. Flujo de login

```
LoginForm / AdminLogin            Backend                                     Email
  │ POST /auth/login {email,password}
  │───────────────────────────────▶ usuario (addSelect password) + estado
  │                                 bcrypt.compare → 401 genérico si falla
  │                                 estado ≠ activo → 403
  │                                 crearOTP(usuario) [crypto.randomInt] ─────▶ código
  │◀─────────────────────────────── 200 {requiresOTP, challenge, expiresIn, codigoDev?}
  │ OTPVerificationForm
  │ POST /auth/otp/verificar {challenge, codigo}
  │───────────────────────────────▶ verificarChallenge → sub
  │                                 validarOTP(usuario.email, codigo): vigente, no usado, intentos < 5
  │                                 si falla → intentos++ → 401
  │                                 firmarAccessToken(usuario)
  │◀─────────────────────────────── 200 {token, usuario (sin password), expiresIn: "24h"}
  │ useUsuario().login(data, remember)
```

- `otp.service.ts`: `generarCodigo` pasa a `crypto.randomInt(100000, 1000000)`. `validarOTP` rechaza cuando `intentos >= 5` (hoy solo incrementa). `crearOTP` invalida los OTP vigentes anteriores del mismo email (lo usa `reenviar`, AUTH.10).
- El challenge lleva `jti` (`crypto.randomUUID()`) y `OTP` gana la columna `challengeJti` (aditiva). `reenviar` cuenta los OTP con ese `jti`: con 4 o más (el original + 3 reenvíos) responde 429 (AUTH.16); si alguno llegó a 5 intentos, responde 401 (AUTH.6).
- `codigoDev`: solo con `env.NODE_ENV === 'development'` (AUTH.11).
- Frontend: `LoginForm` hace una sola llamada y pasa `{ email, challenge }` a `OTPVerificationForm`. Ese formulario recibe `onVerified(data)`: la tienda navega a `/admin/dashboard` si `usePermisos` devuelve módulos y a `/` si no (ya no compara nombres de rol). `AdminLogin` reutiliza el mismo formulario como segundo paso.

## 5. Usuarios

- `Usuario.password`: `@Column({ length: 255, select: false })`. Los únicos lugares que lo leen (login y cambio de password) usan `createQueryBuilder('u').addSelect('u.password')`.
- `register`: busca el rol con `LOWER(nombre) = 'cliente'` y el estado con `LOWER(nombre) = 'activo'` **antes** de abrir la transacción actual. Si no existen, responde 500 y registra el error. El front (`RegisterForm.jsx:132`) deja de enviar `rolId`.
- Nuevo controller `crearUsuarioAdmin` para `POST /api/usuarios`: reutiliza la lógica de `register` pero toma `rolId`/`estadoId`, y verifica USR.3 (solo un superadmin asigna roles superadmin). `GestionUsuarios.jsx:235` pasa de `/usuarios/register` a `usuariosApi.crear`.
- `update`: si `req.user.id !== id` y el usuario no tiene `USUARIOS:UPDATE` → 403. Si el body trae `rolId` o `estadoId` sin `USUARIOS:UPDATE` → 403 (AUTHZ.8).
- `setup/create-admin`: toma `SELECT GET_LOCK('setup_admin', 10)` antes del `count()` y la libera con `RELEASE_LOCK` al final. Un `count()` + `save` dentro de una transacción no es atómico en MySQL con `REPEATABLE READ`. El rol creado o reutilizado queda con `esSuperAdmin = true`.

## 6. Pedidos y pagos

**`POST /api/pedidos`:** `pedido.controller` pasa `req.user!.id` a `PedidoService.crearPedido` y descarta `req.body.usuarioId`. Lo demás no cambia; la transaccionalidad es de `contexto-ventas`.

**`POST /api/payments/mp/preference { orderId }`** (lecturas antes de llamar a MercadoPago; no hay transacción):

```
pedido = findOne({ id: orderId }, relations: usuario, detallesPedidos.producto)
404 si no existe · 403 si pedido.usuario.id ≠ req.user.id · 409 si estadoPago ≠ PENDIENTE
lineas  = detalles.map(d → { title: d.producto.nombre, quantity: d.cantidad, unit_price_cents: round(d.precio × 100) })
ajuste  = round(pedido.montoTotal × 100) − Σ(unit_price_cents × quantity)
ajuste > 0  → push { title: "Envío, impuestos y comisión", quantity: 1, unit_price_cents: ajuste }
ajuste < 0  → 500 + log (invariante rota: hoy no existen descuentos)
items       = lineas con unit_price = unit_price_cents / 100, currency_id: "PEN"
payer.email = usuario.email ; external_reference = String(pedido.id) ; metadata.orderId = pedido.id
```

**Webhook (`payments.webhook.ts`):** el router recibe `mpClient` por parámetro, igual que `payments.mp.ts`, para poder simularlo en PAG.4 a PAG.6.

```
si MP_WEBHOOK_SECRET → validar x-signature (HMAC-SHA256 del manifest "id:<data.id>;request-id:<x-request-id>;ts:<ts>;",
                       según la documentación de MercadoPago; verificarlo contra la doc oficial en el apply) → 401 si es inválida
payment = MP API get(paymentId)                       // igual que hoy
pedido  = findOne(external_reference)
si pedido.estadoPago === COMPLETADO → 200 sin cambios (PAG.6)
si status === approved:
   si currency === PEN y |transaction_amount − montoTotal| ≤ 0.01 → COMPLETADO (PAG.5)
   si no → warn {orderId, paymentId, esperado, recibido} y sin cambios (PAG.4)
si status ∈ {rejected, cancelled} y estadoPago === PENDIENTE → FALLIDO
200 siempre (como hoy, para evitar reintentos agresivos)
```

**`POST /api/payments/mp/confirm { paymentId?, orderId? }`:**
- Con `paymentId`: MP API get → `external_reference` → pedido → 403 si no es de `req.user.id` → `{ paymentId, statusMp, statusDetail, orderId }` (PAG.8).
- Con solo `orderId`: pedido del usuario → `{ orderId, estadoPago }`.
- Sin ninguno: 400 (PAG.7). Se elimina el bucle que buscaba "el último COMPLETADO" (`payments.mp.ts:205-217`).
- Front: `CheckoutSuccess.jsx` envía `{ paymentId, orderId: external_reference }` desde la query de la redirección, en lugar de `{ preferenceId: paymentId }`.

## 7. Datos: superadmin y módulos nuevos

- `Rol.entity.ts`: `@Column({ type: 'boolean', default: false }) esSuperAdmin`. Es aditivo; con `synchronize: true` se crea al arrancar (este change va antes de `migraciones-bd`).
- `Permiso.entity.ts`: `AdminModulo` agrega `KARDEX` y `ROLES`. Ampliar el enum de MySQL es aditivo.
- `scripts/migrar-permisos-hardening.ts` (idempotente, con `--dry-run`):
  1. Marca `esSuperAdmin = true` en los roles cuyo `LOWER(nombre)` es exactamente `admin` o `administrador`.
  2. **Lista** (no modifica) los demás roles cuyo nombre contiene "admin", para la decisión MANUAL.
  3. Crea las filas `Permiso` de `KARDEX` y `ROLES` × 4 acciones.
  4. Por cada `RolPermiso` con `PRODUCTOS:<acción>`, inserta `KARDEX:<acción>` (AUTHZ.11). `ROLES` **no** se otorga a ningún rol: hoy la gestión de permisos exige `requireAdmin`, y esos roles quedan como superadmin en el paso 1.
  5. Imprime los ids insertados (para el rollback).
- `src/scripts/seed.ts`: el rol `Administrador` se crea con `esSuperAdmin: true`, y la matriz de permisos da `KARDEX` a quien hoy tiene `PRODUCTOS` (Almacenero). `ROLES` no se asigna en el seed.
- Front `menuConfig.js`: `kardex → KARDEX`, `permisos → ROLES`.

## 8. XSS en `ReportesPedidos`

`src/shared/lib/escapeHtml.ts` escapa `& < > " '`. La plantilla de `ReportesPedidos.jsx:156-215` aplica `escapeHtml()` a cada `${…}` que proviene de datos (nombre, email, dirección, productos, notas). Los números se formatean antes de interpolarse.

## 9. Configuración nueva

`env.ts` agrega:

- `AUTH_RATE_LIMIT`: por defecto 10; en `.env.test`, 1000. El test de AUTH.12 construye su propia app con `createApp({ authRateLimit: 3 })`.
- `TRUST_PROXY`: por defecto `false`; `1` en Azure.
- `MP_ACCESS_TOKEN`: obligatorio en production y opcional en test, porque los tests simulan el cliente de MercadoPago.
- `MP_WEBHOOK_SECRET`: opcional.

`JWT_SECRET` desaparece de `.env.example`.

`createApp` (de `estabilizar-base`) gana un parámetro opcional: `createApp(opciones?: { authRateLimit?: number })`, que por defecto usa `env.AUTH_RATE_LIMIT`. `core-backend` lo extiende después con `routers`.

## Archivos

| Archivo | Acción |
|---|---|
| `src/core/auth/{tokens,authenticate,authorize}.ts`, `src/core/types/express.d.ts` | Crear |
| `src/core/auth/rateLimit.ts` | Crear |
| `src/middlewares/{verificarToken,requirePermiso,requireAdmin,adminAuth.middleware}.ts` | Borrar |
| `src/controllers/pagarpedio.controller.ts` | Borrar |
| `src/routes/*.routes.ts` (todos), `src/routes/payments.{mp,webhook}.ts` | Modificar (matriz §3, §6) |
| `src/controllers/{auth,usuarios,permisos,cliente,direccion,tarjeta-usuario,pedido,kardex,setup}.controller.ts` | Modificar |
| `src/services/{otp,pedido,kardex}.service.ts` | Modificar |
| `src/entities/{Rol,Permiso,Usuario,OTP}.entity.ts` | Modificar (`OTP.challengeJti`) |
| `src/middlewares/verificarToken.ts` | Modificar en WU2 (shim) y borrar en WU5 |
| `src/app.ts` | Modificar (quitar `/api/diagnostics`) |
| `scripts/migrar-permisos-hardening.ts`, `src/scripts/seed.ts` | Crear / Modificar |
| `test/helpers/{auth,factories}.ts`, `test/integration/**` | Crear |
| Front: `src/features/auth/api.ts`, `components/auth/{LoginForm,OTPVerificationForm,AuthContainer,RegisterForm}.jsx`, `admin/components/{AdminLogin,GestionUsuarios,CrearAdmin,ReportesPedidos}.jsx`, `admin/menuConfig.js`, `src/features/checkout/api.ts`, `components/checkout/services/paymentService.js`, `pages/CheckoutSuccess.jsx`, `src/shared/lib/escapeHtml.ts` | Modificar / Crear |

## Tests que acompañan el change

Helpers: `crearUsuario({ rol, permisos, activo })` y `tokenPara(usuario)` en `test/helpers/`. Cliente de MercadoPago inyectable (`payments` recibe `mpClient` en la construcción del router) para simularlo en los tests.

| Escenarios | Test |
|---|---|
| AUTH.1 a AUTH.17 | `test/integration/auth.test.ts` (envío de email simulado con un spy sobre el transporte de nodemailer; AUTH.17 con `X-Forwarded-For` y `TRUST_PROXY=1`) |
| AUTHZ.1 a AUTHZ.4 | `test/integration/matriz-rutas.test.ts`: tabla parametrizada con todas las filas de §3 (sin token / sin permiso / con permiso) |
| AUTHZ.5 a AUTHZ.8 | `test/integration/recursos-propios.test.ts` |
| AUTHZ.9 a AUTHZ.13 | `test/integration/superadmin-y-modulos.test.ts` + test del script con `--dry-run` |
| Smoke tests de `estabilizar-base` | `test/smoke/productos.test.ts` pasa a usar `tokenPara(superadmin)`: tras este change, `POST /api/products` sin token responde 401 antes de validar |
| USR.1 a USR.7 | `test/integration/usuarios.test.ts` + chequeo recursivo de que no hay clave `password` en los bodies |
| PED.1 a PED.5 | `test/integration/pedidos.test.ts` |
| PAG.1 a PAG.8 | `test/integration/pagos.test.ts` con el cliente de MercadoPago simulado; PAG.3 como unitario de `construirItems()` |
| ADMUI.1, ADMUI.2 | `tests/unit/shared/escapeHtml.test.ts` + verificación manual de la impresión |

## Preguntas abiertas

- **Roles con "admin" en el nombre que no se llaman exactamente `admin`/`administrador`:** el script los lista y el usuario decide si son superadmin (MANUAL, antes del deploy). No bloquea el apply.
- **`MP_WEBHOOK_SECRET`:** confirmar que la cuenta de MercadoPago tiene configurada la clave secreta del webhook. Si no la tiene, la verificación de firma queda desactivada y la verificación de monto sigue protegiendo.
