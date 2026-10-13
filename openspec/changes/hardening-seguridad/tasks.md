# Tareas: Hardening de seguridad

## Pronóstico de revisión

| Campo | Valor |
|---|---|
| Líneas cambiadas estimadas | 1.800 – 2.300 (≈ 45 % son tests) |
| Riesgo frente al presupuesto de 400 líneas | Alto si va en un PR → se parte en 5 |
| PRs encadenados | Sí |
| Estrategia | WU1 se fusiona a `main` y se despliega solo. WU2 a WU5 son PRs contra la rama `change/hardening-seguridad`, que entra a `main` con un único merge (ver Fase 6) |

### Work units

| Unidad | Objetivo | PR | Notas |
|---|---|---|---|
| WU1 | `core/auth` + datos (superadmin, módulos) + helpers de test | PR 1 → `main` | Aditivo: todavía no se aplica a las rutas. Se despliega solo, para crear la columna y el enum antes del script |
| WU2 | Login con challenge (back + front) + shim de transición | PR 2 → `change/…` | Cambia el contrato del login |
| WU3 | Matriz de rutas + usuarios + recursos propios (back + front) | PR 3 → `change/…` | El más grande en tests |
| WU4 | Pedidos y pagos (back + front) | PR 4 → `change/…` | |
| WU5 | Limpieza + XSS | PR 5 → `change/…` | Borra middlewares viejos (incluido el shim) y endpoints eliminados |

## Fase 1 (WU1): Núcleo de auth y datos

- [ ] 1.1 **IMPL**: `test/helpers/factories.ts` (`crearUsuario({ rol, permisos, activo })`).
- [ ] 1.2 **TEST**: `test/unit/auth/tokens.test.ts`: firma y verificación; un challenge rechazado como token de acceso y al revés; HS256 rechazado (AUTH.15); payload legacy rechazado (AUTH.13).
- [ ] 1.3 **IMPL**: `src/core/auth/tokens.ts` y `src/core/types/express.d.ts`. Después, `test/helpers/auth.ts` (`tokenPara(usuario)`, `tokenLegacy(payload)`), que depende de `tokens.ts`.
- [ ] 1.4 **IMPL**: `Rol.esSuperAdmin` y `AdminModulo` += `KARDEX`, `ROLES`.
- [ ] 1.5 **TEST**: `test/integration/authenticate-authorize.test.ts`: router de prueba montado en `createApp` con cada combinación (sin token 401, inactivo 401 [AUTH.14], sin permiso 403, permiso 2xx, superadmin 2xx [AUTHZ.10], nombre engañoso 403 [AUTHZ.9], `requireSelfOr` self/otro/permiso).
- [ ] 1.6 **IMPL**: `src/core/auth/{authenticate,authorize}.ts` (`design.md` §2).
- [ ] 1.7 **TEST**: Test del script con `--dry-run` sobre datos semilla: la parte de datos de AUTHZ.11 (`KARDEX` otorgado, ningún `ROLES`). La parte HTTP se prueba en la tarea 3.3, cuando kardex ya está protegido.
- [ ] 1.8 **IMPL**: `scripts/migrar-permisos-hardening.ts` (`design.md` §7) y actualización de `src/scripts/seed.ts`.
- [ ] 1.9 **VERIFY**: `npx tsc --noEmit && npm test`. Correr el script con `--dry-run` contra la DB de desarrollo y revisar la lista de roles "admin*".
- [ ] 1.10 **MANUAL**: Fusionar WU1 a `main` y desplegar (el arranque crea `Rol.esSuperAdmin` y los valores nuevos del enum). Con la salida del `--dry-run` contra producción, decidir qué roles adicionales son superadmin. Correr el script real contra producción y guardar su salida (ids insertados). Recién entonces crear la rama `change/hardening-seguridad` desde `main`.

## Fase 2 (WU2): Login con challenge

- [ ] 2.1 **TEST**: `test/integration/auth.test.ts`: AUTH.1 a AUTH.12, AUTH.16 y AUTH.17 (transporte de email simulado; AUTH.12 con `createApp({ authRateLimit: 3 })`).
- [ ] 2.2 **IMPL**: `otp.service.ts`: `crypto.randomInt`, `validarOTP` con tope de intentos, invalidación de OTP anteriores en `crearOTP`, y `OTP.challengeJti` con los topes de reenvío (`design.md` §4).
- [ ] 2.3 **IMPL**: `auth.controller.ts`: `login` (challenge), `adminLogin` como alias, `verificarOTP({ challenge, codigo })`, `reenviarOTP` y `verifyToken` con `authenticate`. `codigoDev` solo en development. Variables nuevas de `env.ts` y `.env.test` (`design.md` §9). `crearRateLimit(max)` en `src/core/auth/rateLimit.ts`, instanciado dentro de `createApp()`, y `app.set('trust proxy', env.TRUST_PROXY)`. Shim de transición en `verificarToken.ts` (`sub` → `userId`/`id`, `design.md` §2).
- [ ] 2.4 **IMPL**: Quitar `POST /usuarios/login` (ruta y controller) y `POST /auth/otp/solicitar` (AUTH.8).
- [ ] 2.5 **IMPL** (front): `features/auth/api.ts` (`login`, `verificarOtp`, `reenviarOtp`). `LoginForm` hace una sola llamada. `AuthContainer` guarda el `challenge`. `OTPVerificationForm` recibe `challenge` y `onVerified`, y navega según `usePermisos` (sin nombres de rol). `AdminLogin` agrega el paso de OTP. `RegisterForm` deja de enviar `rolId`.
- [ ] 2.6 **VERIFY** (manual): login de cliente con "recordarme" y sin él; login de admin con OTP; reenviar código; 5 códigos erróneos bloquean; en development aparece `codigoDev` y en test no.

## Fase 3 (WU3): Matriz de rutas, usuarios y recursos propios

- [ ] 3.1 **TEST**: `test/integration/matriz-rutas.test.ts`: una fila parametrizada por ruta de `design.md` §3 (AUTHZ.1 a AUTHZ.4). Actualizar `test/smoke/productos.test.ts` (VAL.1 y VAL.2) para usar `tokenPara(superadmin)`.
- [ ] 3.2 **IMPL**: Aplicar `authenticate`/`authorize`/`requireSelfOr` en `routes/{productos,categoria,subcategoria,tienda,metodopago,metodoenvio,estado,masterTable,dashboard,kardex,rol,permisos,usuarios,cliente,direccion,tarjeta-usuario}.routes.ts`.
- [ ] 3.3 **TEST**: `test/integration/recursos-propios.test.ts`: AUTHZ.5 a AUTHZ.8 y AUTHZ.12. `test/integration/superadmin-y-modulos.test.ts`: la parte HTTP de AUTHZ.11 y AUTHZ.13.
- [ ] 3.4 **IMPL**: Controllers de `direccion`, `tarjeta-usuario`, `cliente` y `kardex`: usuario desde `req.user`; verificación de dueño en `/:id`. `permisos.controller`: `meModulos` usa `req.user` y `esSuperAdmin`; `reemplazarPermisosRol` y `asignarRol` aplican AUTHZ.13; `seed` usa `requireSuperAdmin`.
- [ ] 3.5 **TEST**: `test/integration/usuarios.test.ts`: USR.1 a USR.7, más un recorrido recursivo que verifica que ninguna respuesta tenga `password`.
- [ ] 3.6 **IMPL**: `Usuario.password` con `select: false` (+ `addSelect` en el login). `register` con rol cliente forzado. Nuevo `POST /usuarios` (`crearUsuarioAdmin`, USR.3). `update` con reglas de dueño y AUTHZ.13. `setup/create-admin` con `GET_LOCK` y superadmin (`design.md` §5).
- [ ] 3.7 **IMPL** (front): `GestionUsuarios` y `CrearAdmin` crean usuarios con `usuariosApi.crear` (`POST /usuarios`). `menuConfig.js`: `kardex → KARDEX`, `permisos → ROLES`.
- [ ] 3.8 **VERIFY** (manual): cada pantalla del admin con un superadmin, con un Almacenero (solo catálogo y kardex) y con un Vendedor (solo pedidos). Perfil de cliente: ver y editar datos (AUTHZ.7), direcciones, tarjetas y pedidos. Catálogo público sin sesión (AUTHZ.4).

## Fase 4 (WU4): Pedidos y pagos

- [ ] 4.1 **TEST**: `test/unit/pagos/construirItems.test.ts`: PAG.1 y PAG.3 (casos con decimales, envío 0 y con comisión).
- [ ] 4.2 **TEST**: `test/integration/pedidos.test.ts` (PED.1 a PED.5) y `test/integration/pagos.test.ts` (PAG.2, PAG.4 a PAG.8) con el cliente de MercadoPago simulado.
- [ ] 4.3 **IMPL**: `pedido.controller`: usuario del token y acceso de dueño. Quitar `PATCH /:id/estado-pago`, `POST /pagar` y `pagarpedio.controller.ts`.
- [ ] 4.4 **IMPL**: `payments.mp.ts`: `construirItems(pedido)`, preferencia con dueño y estado, y `/confirm` según `design.md` §6. Inyectar el cliente de MercadoPago en la construcción del router.
- [ ] 4.5 **IMPL**: `payments.webhook.ts`: recibe `mpClient` por parámetro (igual que en 4.4); firma opcional, verificación de monto y moneda, idempotencia y paso a `FALLIDO`.
- [ ] 4.6 **IMPL** (front): `features/checkout/api.ts` → `crearPreferenciaMp(orderId)`; `paymentService` sin `items`; `CheckoutSuccess` envía `{ paymentId, orderId }` desde la query.
- [ ] 4.7 **VERIFY** (manual, sandbox de MercadoPago): compra completa → `success` → pedido `COMPLETADO` por webhook. Compra rechazada → `FALLIDO`. Repetir la notificación no cambia nada.

## Fase 5 (WU5): Limpieza y XSS

- [ ] 5.1 **TEST**: `tests/unit/shared/escapeHtml.test.ts` (ADMUI.1, ADMUI.2).
- [ ] 5.2 **IMPL**: `src/shared/lib/escapeHtml.ts` y su aplicación en `ReportesPedidos.jsx:156-215`.
- [ ] 5.3 **IMPL**: Borrar `middlewares/{verificarToken,requirePermiso,requireAdmin,adminAuth.middleware}.ts` y `GET /api/diagnostics`. Quitar `JWT_SECRET` de `.env.example`.
- [ ] 5.4 **VERIFY**: `grep -rnE "includes\(['\"]admin|jwt\.(sign|verify)|process\.env\.JWT_SECRET" src` → solo `src/core/auth/tokens.ts` para `jwt.*`. `npx tsc --noEmit && npm test` (back), `npm test && npm run build` (front).

## Fase 6: Despliegue coordinado

> Requisito: la tarea 1.10 ya se hizo (WU1 en producción y script aplicado). Mientras dure el change, a `main` no entra nada más.

- [ ] 6.1 **VERIFY**: Volver a correr el script en producción con `--dry-run`. No debe haber nada pendiente; si un rol nuevo apareció entre tanto, decidir y aplicar.
- [ ] 6.2 **MANUAL**: Configurar `NODE_ENV=production`, `TRUST_PROXY=1`, `AUTH_RATE_LIMIT` y (si existe) `MP_WEBHOOK_SECRET` en Azure.
- [ ] 6.3 **MANUAL**: Fusionar `change/hardening-seguridad` a `main` con un único merge. Eso dispara `backend.yml` y `frontend.yml` a la vez. Avisar que todos deben volver a iniciar sesión (los tokens previos se invalidan).
- [ ] 6.4 **VERIFY** (producción): login de cliente y de admin; `GET /api/usuarios` sin token → 401; `POST /api/usuarios/register` con `rolId: 1` → rol cliente; una compra de prueba en sandbox.

## Fase 7: Cierre

- [ ] 7.1 Barrido de patrones en el diff: no quedan `req.body.usuarioId` / `req.body.usuario_id` / `req.params.usuarioId` usados como identidad sin pasar por `requireSelfOr`; no quedan `(req as any).usuario`.
- [ ] 7.2 Actualizar `DOCUMENTACION_SISTEMA_PERMISOS.md` (superadmin explícito, módulos nuevos, matriz) y `CLAUDE.md` (sección de auth).
- [ ] 7.3 `verify-report.md`, archivar el change y actualizar el roadmap.
