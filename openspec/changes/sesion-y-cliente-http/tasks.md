# Tareas: Sesión única y cliente HTTP único

## Pronóstico de revisión

| Campo | Valor |
|---|---|
| Líneas cambiadas estimadas | 1.600 – 2.000 |
| Riesgo frente al presupuesto de 400 líneas | Alto si va en un PR → se parte en 6 |
| PRs encadenados | Sí |
| Estrategia | Un PR por work unit, en orden |

### Work units

| Unidad | Objetivo | PR | Notas |
|---|---|---|---|
| WU1 | Infraestructura `shared/` + `UsuarioProvider` + tests | PR 1 | Sin cambios visibles |
| WU2 | Auth y shell del admin (login, OTP, registro, `AdminRoute`, `Sidebar`, `Dashboard`, headers) | PR 2 | Activa la sesión única y el control por módulo |
| WU3a | Catálogo, tiendas y búsqueda | PR 3 | |
| WU3b | Checkout y perfil | PR 4 | Corrige SES.5 |
| WU4a | Admin de catálogo: productos, categorías, subcategorías, kardex | PR 5 | `FormData` |
| WU4b | Admin restante: usuarios, permisos, estados, métodos de pago, tiendas, master-table, pedidos | PR 6 | Activa la barrera de CI al final |

## Fase 1 (WU1): Infraestructura

- [ ] 1.1 **IMPL**: Alias `@/` → `src/` en `vite.config.js` y `tsconfig.json`. Instalar `msw` como devDependency y crear `tests/setup/msw.ts` (servidor msw en `beforeAll`/`afterEach`/`afterAll`).
- [ ] 1.2 **TEST**: `tests/unit/shared/session.test.ts`: SES.1, SES.3, SES.4 (solo `clear`) y SES.6.
- [ ] 1.3 **IMPL**: `src/shared/auth/session.ts` (`design.md` §3).
- [ ] 1.4 **TEST**: `tests/unit/shared/client.test.ts`: HTTP.1 a HTTP.8. `tests/unit/shared/assets.test.ts`: HTTP.9 y HTTP.10.
- [ ] 1.5 **IMPL**: `src/shared/api/{client,errors,assets}.ts` (`design.md` §1-2).
- [ ] 1.6 **TEST**: `tests/unit/shared/usePermisos.test.tsx`: ADM.2.
- [ ] 1.7 **IMPL**: `src/shared/auth/{permisosApi,usePermisos}.ts`; `session.clear()` invalida la caché.
- [ ] 1.8 **IMPL**: Reescribir `src/context/userContext.jsx` sobre `session` con el mismo contrato (`design.md` §4).
- [ ] 1.9 **VERIFY**: `npm test` y `npm run build`. A mano: login de cliente, recarga y logout funcionan igual que antes.

## Fase 2 (WU2): Auth y shell del admin

- [ ] 2.1 **IMPL**: `src/features/auth/api.ts` (`design.md` §6).
- [ ] 2.2 **IMPL**: Migrar `components/auth/{LoginForm,OTPVerificationForm,RegisterForm}.jsx`, `admin/components/{AdminLogin,SetupAdmin}.jsx`. `AdminLogin` usa `useUsuario().login(data, true)` (SES.2).
- [ ] 2.3 **TEST**: `tests/unit/admin/AdminRoute.test.tsx`: ADM.3, ADM.4, ADM.5 (con `Sidebar`) y ADM.6.
- [ ] 2.4 **IMPL**: `menuConfig.js`: agregar `moduloDeRuta` y `primeraRutaPermitida`; quitar `getAdminInfo` (consumidores → `session`). Reescribir `AdminRoute.jsx` (`design.md` §5).
- [ ] 2.5 **IMPL**: `Sidebar.jsx`, `Dashboard.jsx` (sin su verificación propia), `admin/components/Header.jsx` y `components/layout/PublicHeader.jsx` → `usePermisos()` y `useUsuario()`.
- [ ] 2.6 **VERIFY** (manual): login de admin → aparece logueado también en la tienda (SES.2); logout desde el sidebar → `/admin/dashboard` redirige a `/admin/login` (SES.4); un usuario solo con `PRODUCTOS` → `/admin/usuarios` lo redirige (ADM.3); en DevTools hay 1 request a `me/modulos` (ADM.2); un navegador con `adminToken` viejo conserva la sesión (SES.3).

## Fase 3 (WU3a): Catálogo, tiendas y búsqueda

- [ ] 3.1 **IMPL**: `src/features/catalogo/api.ts` y `src/features/tiendas/api.ts`.
- [ ] 3.2 **IMPL**: Migrar `components/productos/{productos,productCard,detalleproductomodal}.jsx`, `components/carousel/categoriacarousel.jsx`, `components/{SubcategoriaFilter,SubcategoriaSelector,SubcategoriasMultiples}.jsx`, `pages/{ResultadosBusqueda,Tiendas}.jsx`. Las imágenes pasan a `assetUrl()`.
- [ ] 3.3 **VERIFY** (manual): home, catálogo con paginación y filtros por subcategoría, búsqueda, modal de producto, carrusel de categorías y página de tiendas; las imágenes cargan.

## Fase 4 (WU3b): Checkout y perfil

- [ ] 4.1 **IMPL**: `src/features/checkout/api.ts` y `src/features/perfil/api.ts`.
- [ ] 4.2 **IMPL**: Migrar `components/checkout/services/{checkoutService,paymentService}.js` (quitar los parámetros `userToken` y el `API_URL` propio), `components/checkout/hooks/{useCheckoutData,useCheckoutForm}.js` (quitar `usuario?.token`, línea 248), `components/checkout/components/OrderSummary.jsx`, `components/checkout/steps/Step1Shipping.jsx` (`assetUrl`) y `pages/CheckoutSuccess.jsx`.
- [ ] 4.3 **IMPL**: Migrar `components/perfil/{profile,direccion,metodopago,orders}.jsx` y `pages/Perfil.jsx`. `refrescarUsuarioDesdeAPI` usa `perfilApi`.
- [ ] 4.4 **VERIFY** (manual): checkout completo hasta la preferencia de MercadoPago con `Authorization` en `POST /api/pedidos` (SES.5). Perfil: ver y editar datos, direcciones (crear, editar, principal, eliminar), tarjetas y pedidos. Anotar los fallos que ya existían (p. ej. `metodopago.jsx:148`, `/clientes/me`) **sin corregirlos aquí**; se corrigen en `hardening-seguridad`.

## Fase 5 (WU4a): Admin de catálogo

- [ ] 5.1 **TEST**: `tests/unit/features/admin/productos.api.test.ts`: crear y actualizar envían `multipart/form-data` con `imagen`.
- [ ] 5.2 **IMPL**: `src/features/admin/{productos,categorias,subcategorias,kardex}/api.ts`.
- [ ] 5.3 **IMPL**: Migrar `GestionProducto.jsx`, `GestionCategorias.jsx`, `GestionSubcategorias.jsx` y `GestionKardex.jsx` (imágenes con `assetUrl`).
- [ ] 5.4 **VERIFY** (manual): CRUD completo de cada pantalla, incluida la subida de imagen de producto y un movimiento de kardex.

## Fase 6 (WU4b): Admin restante y barrera

- [ ] 6.1 **IMPL**: `src/features/admin/{usuarios,permisos,estados,metodos-pago,tiendas,master-table,pedidos,dashboard}/api.ts`.
- [ ] 6.2 **IMPL**: Migrar `GestionUsuarios.jsx`, `CrearAdmin.jsx`, `GestionPermisos.jsx`, `GestionEstados.jsx`, `GestionMetodoPago.jsx`, `GestionTienda.jsx`, `ReportesPedidos.jsx`, `Dashboard.jsx` (estadísticas) y `hooks/useMasterTable.js`.
- [ ] 6.3 **IMPL**: Reglas de ESLint `no-restricted-globals` (fetch) y `no-restricted-imports` (axios, con override en `client.ts`). Agregar el paso "Sin llamadas HTTP directas" a `frontend.yml` (`design.md` §7).
- [ ] 6.4 **VERIFY**: `grep -rnE "fetch\(|localhost:[0-9]" src` → vacío. `import axios` solo en `client.ts`. En el PR, provocar a propósito un `fetch(` en un commit temporal y comprobar que el CI falla (HTTP.11); luego revertirlo.
- [ ] 6.5 **VERIFY** (manual): CRUD de cada pantalla del admin, reordenar estados, asignar permisos a un rol, crear un admin, ver el detalle de un pedido y cambiarle el estado, master-table con jerarquía, dashboard.

## Fase 7: Cierre

- [ ] 7.1 Barrido de patrones en el diff: no quedan `localStorage.getItem('token')`, `adminToken`, `getAuthHeaders()` en uso nuevo, ni `API_URL =` locales.
- [ ] 7.2 Actualizar `CLAUDE.md` (cliente HTTP único, sesión única, sin `adminToken`).
- [ ] 7.3 Escribir `verify-report.md`, mover el change a `archive/` y actualizar el roadmap.
