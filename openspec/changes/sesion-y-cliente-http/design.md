# Diseño: Sesión única y cliente HTTP único

## Enfoque técnico

Se construyen tres piezas en `src/shared/` (cliente, sesión y permisos), con tests y sin consumidores. Después se reconecta `UsuarioProvider` encima de ellas manteniendo su API pública. Por último se migran los 41 archivos con llamadas HTTP, área por área: cada uno pasa a llamar funciones de un `api.ts` por feature. La barrera de CI se activa cuando el último archivo está migrado.

Los archivos nuevos van en TypeScript (`allowJs` ya activo desde `estabilizar-base`, ADR-11). Los componentes existentes siguen en `.jsx`.

## Decisiones

| Decisión | Elegida | Alternativas | Rationale |
|---|---|---|---|
| Claves de storage | Se mantienen `token`/`usuario`; desaparecen `adminToken`/`adminUser` | Clave nueva `tm.session` | Hoy la mayoría del código ya usa `token`/`usuario`; menos migración y menos riesgo |
| Sesión única para admin y tienda | Sí | Dos sesiones aisladas | Es el mismo `Usuario` con un rol. Dos sesiones fueron la causa del logout que no revoca y de los tokens cruzados |
| Estado de la sesión en React | Store externo + `useSyncExternalStore` | Solo Context con `useState` | El cliente HTTP (fuera de React) y los componentes leen la misma fuente sin desincronizarse |
| Redirección por 401 | `window.location.assign()` desde el interceptor | Exponer `navigate` de React Router al interceptor | El interceptor vive fuera del árbol de React; una recarga completa también limpia el estado en memoria |
| Dónde viven las funciones de API | `src/features/<feature>/api.ts` desde ya | `src/api/modules/*` (v1) o inline en los componentes | Es su ubicación final (ADR-10); cuando se mueva el resto de la feature no hay que tocarlas |
| Tests de red | `msw` (Mock Service Worker) en Node | Mockear axios | Prueba el cliente real con sus interceptores |
| Barrera | Paso de CI con grep (bloqueante) + reglas de ESLint (feedback en el editor) | Solo ESLint | El lint sigue siendo informativo hasta `limpieza-final`; el grep bloquea ya |

## 1. `src/shared/api/client.ts`

```ts
import axios, { AxiosError } from 'axios';
import { session } from '@/shared/auth/session';

const origin = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:5001' : undefined);
if (!origin) throw new Error('VITE_API_URL no está definida');                     // HTTP.2
export const API_ORIGIN = origin.replace(/\/+$/, '');

export const api = axios.create({ baseURL: `${API_ORIGIN}/api` });              // HTTP.1

api.interceptors.request.use((config) => {
  const token = session.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;                   // HTTP.3 / HTTP.4
  return config;
});

api.interceptors.response.use(undefined, (error: AxiosError) => {
  const status = error.response?.status ?? 0;
  const sentToken = Boolean(error.config?.headers?.Authorization);
  if (status === 401 && sentToken) {                                             // HTTP.5
    session.clear();
    window.location.assign(window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login');
  }
  return Promise.reject(toApiError(error));                                      // HTTP.6 / 7 / 8
});
```

- `src/shared/api/errors.ts`: `class ApiError extends Error { status; details? }` y `toApiError()`, que lee `data.message ?? data.error`.
- Alias `@/` → `src/` en `vite.config.js` y en `tsconfig.json` (`paths`).
- `Content-Type`: axios lo deduce. Con `FormData` (productos) no se fija a mano.

## 2. `src/shared/api/assets.ts`

```ts
const LEGACY_ORIGINS = ['http://localhost:3000', 'http://localhost:5001'];
export function assetUrl(path?: string | null): string { … }                    // HTTP.9 / HTTP.10
```

Reemplaza `normalizeImageUrl` de `OrderSummary.jsx:18` y `Step1Shipping.jsx:55`, y las concatenaciones `${URL}/${imagen}` de `GestionProducto`, `GestionCategorias`, `GestionSubcategorias`, `productCard` y `categoriacarousel`.

## 3. `src/shared/auth/session.ts`

```ts
export type UsuarioSesion = { id: number; email: string; nombre: string; rol?: { id: number; nombre: string } | null } & Record<string, unknown>;
type Session = { token: string; usuario: UsuarioSesion } | null;

export const session = {
  get(): Session,
  getToken(): string | null,
  set(data: { token: string; usuario: UsuarioSesion }, opts?: { remember?: boolean }): void,  // SES.1 / SES.2
  updateUsuario(usuario: UsuarioSesion): void,      // refrescarUsuarioDesdeAPI
  clear(): void,                                    // SES.4: borra ambos storages + caché de permisos
  subscribe(listener: () => void): () => void,
};
```

- La lectura inicial hace la migración legacy (SES.3): adopta `adminToken`/`adminUser` si no hay `token`, y borra las claves legacy siempre.
- Escucha `window` `storage` sobre la clave `token` y vuelve a leer (SES.6).
- `menuConfig.getAdminInfo()` se reemplaza por `session.get()?.usuario`.

## 4. `UsuarioProvider` (`src/context/userContext.jsx`)

Mantiene exactamente su contrato actual: `usuario`, `login(loginData, remember)`, `logout`, `getToken`, `isAuthenticated`, `getAuthHeaders`, `reloadUserFromStorage` y `refrescarUsuarioDesdeAPI`. Por dentro:

- `usuario` = `useSyncExternalStore(session.subscribe, () => session.get()?.usuario ?? null)`.
- `login` normaliza los dos formatos que acepta hoy (`{usuario, token}` y `{token, ...usuario}`) y llama a `session.set`.
- `getAuthHeaders` queda marcado `@deprecated` (el cliente ya pone el header). Se elimina en `frontend-base-features`.
- `refrescarUsuarioDesdeAPI` usa `perfilApi.getUsuario(id)` + `session.updateUsuario`.
- El `value` se memoiza (hoy se recrea en cada render).

## 5. Permisos y acceso al admin

`src/shared/auth/usePermisos.ts`:

```ts
// Caché a nivel de módulo, ligada al token: una promesa por sesión (ADM.2). session.clear() la invalida.
export function usePermisos(): { modulos: string[] | null; loading: boolean; error: ApiError | null };
```

`src/admin/menuConfig.js` queda como única fuente ruta → módulo (ADM.1). Agrega dos helpers:

```js
export function moduloDeRuta(pathname) { /* item cuyo `to` es prefijo de pathname */ }
export function primeraRutaPermitida(modulos) { /* primer item con modulo ∈ modulos */ }
```

`AdminRoute` (sin la lógica duplicada de `adminToken`):

```
needsSetup?             → <SetupAdmin/>                                     (ADM.6, igual que hoy)
sin sesión?             → <Navigate to="/admin/login"/>                     (ADM.4)
modulos cargando        → loader
modulos vacíos          → <Navigate to="/"/>
ruta sin permiso        → <Navigate to={primeraRutaPermitida(modulos)}/>    (ADM.3)
si no                   → children
```

- `Dashboard.jsx` pierde su verificación propia (líneas 50-98), porque ahora la hace `AdminRoute`.
- `Sidebar.jsx` filtra con `usePermisos()` (ADM.5) y su logout usa `useUsuario().logout` (SES.4).
- `PublicHeader.jsx` usa `usePermisos()` para decidir si muestra el acceso al panel.
- El mapeo `permisos → MASTER_TABLE` y `kardex → PRODUCTOS` de `menuConfig` se conserva tal cual. Los módulos `ROLES` y `KARDEX` llegan con `hardening-seguridad`.

## 6. Módulos `api.ts`

Cada función devuelve `response.data` tipado. Los nombres siguen el endpoint actual; no cambia ningún contrato.

| Archivo | Funciones (endpoints actuales) | Consumidores |
|---|---|---|
| `features/auth/api.ts` | `loginPassword` (`POST /usuarios/login`), `solicitarOtp`, `verificarOtp`, `adminLogin`, `registrar` (`POST /usuarios/register`), `setupStatus`, `crearPrimerAdmin` | `LoginForm`, `OTPVerificationForm`, `RegisterForm`, `AdminLogin`, `AdminRoute`, `SetupAdmin` |
| `shared/auth/permisosApi.ts` | `misModulos` (`GET /permisos/me/modulos`) | `usePermisos` |
| `features/catalogo/api.ts` | `listarProductos(params)`, `obtenerProducto`, `listarCategorias`, `listarSubcategorias`, `subcategoriasPorCategoria` | `productos.jsx`, `productCard`, `detalleproductomodal`, `categoriacarousel`, `Subcategoria{Filter,Selector}`, `SubcategoriasMultiples`, `ResultadosBusqueda` |
| `features/tiendas/api.ts` | `listarTiendasActivas` | `pages/Tiendas.jsx` |
| `features/checkout/api.ts` | `metodosPago`, `metodosEnvio`, `direccionesDeUsuario`, `tarjetasDeUsuario`, `crearPedido`, `crearPreferenciaMp`, `obtenerPedido`, `confirmarPagoMp` | `checkoutService.js`, `paymentService.js` (pasan a ser wrappers finos o se eliminan), `useCheckoutData`, `useCheckoutForm`, `CheckoutSuccess` |
| `features/perfil/api.ts` | `obtenerUsuario`, `actualizarUsuario`, `clienteMe`, `actualizarClienteMe`, CRUD de direcciones y tarjetas, `pedidosDeUsuario`, `tiposCliente` | `profile.jsx`, `direccion.jsx`, `metodopago.jsx`, `orders.jsx`, `pages/Perfil.jsx`, `userContext` |
| `features/admin/<recurso>/api.ts` × 11 | CRUD de `productos` (con `FormData`), `categorias`, `subcategorias`, `estados` (+ `orden/actualizar`), `metodos-pago`, `tiendas`, `usuarios` (+ `roles`), `permisos`, `pedidos` (reportes), `kardex`, `master-table`, `dashboard` | `Gestion*.jsx`, `ReportesPedidos`, `CrearAdmin`, `Dashboard`, `useMasterTable` |

Los parámetros `userToken` desaparecen de `checkoutService.fetchUserAddresses/fetchUserCards` y de `useCheckoutForm.js:248`. Con eso se corrige SES.5.

## 7. Barrera en CI y ESLint

`.github/workflows/frontend.yml`, en el job `verify` antes del build:

```yaml
- name: Sin llamadas HTTP directas
  run: |
    ! grep -rnE "fetch\(|localhost:[0-9]+" src
    ! grep -rnE "from ['\"]axios['\"]" src | grep -v "^src/shared/api/client.ts"
```

`eslint.config.js`: `no-restricted-globals: ['error', 'fetch']` y `no-restricted-imports` para `axios`, con override en `src/shared/api/client.ts`.

## Archivos

| Archivo | Acción |
|---|---|
| `src/shared/api/{client,errors,assets}.ts`, `src/shared/auth/{session,usePermisos,permisosApi}.ts` | Crear |
| `src/features/{auth,catalogo,tiendas,checkout,perfil}/api.ts`, `src/features/admin/*/api.ts` | Crear |
| `src/context/userContext.jsx`, `src/admin/menuConfig.js`, `src/components/AdminRoute.jsx` | Modificar |
| Los 41 archivos con llamadas HTTP (lista en `tasks.md`) + `useCheckoutForm.js`, `useCheckoutData.js` | Modificar |
| `vite.config.js`, `tsconfig.json` (alias `@/`), `eslint.config.js`, `package.json` (`msw`), `.github/workflows/frontend.yml` | Modificar |
| `tests/unit/shared/{client,assets,session}.test.ts`, `tests/unit/shared/usePermisos.test.tsx`, `tests/unit/admin/AdminRoute.test.tsx`, `tests/unit/features/admin/productos.api.test.ts` | Crear |

## Tests que acompañan el change

| Escenarios | Test |
|---|---|
| HTTP.1 a HTTP.8 | `client.test.ts` con msw; `vi.stubEnv` + import dinámico para HTTP.1/HTTP.2 |
| HTTP.9, HTTP.10 | `assets.test.ts` |
| SES.1, SES.3, SES.4, SES.6 | `session.test.ts` (storage de jsdom + `StorageEvent` sintético) |
| ADM.2 | `usePermisos.test.tsx`: 3 consumidores montados, msw cuenta 1 request |
| ADM.3 a ADM.6 | `AdminRoute.test.tsx` con `MemoryRouter` |
| Envío de `FormData` en productos | `productos.api.test.ts`: msw recibe `multipart/form-data` con `imagen` |
| SES.2, SES.5, HTTP.11 | Verificación manual (checklist de `tasks.md`) |
