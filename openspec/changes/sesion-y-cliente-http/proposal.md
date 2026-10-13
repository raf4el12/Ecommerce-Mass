# Propuesta: Sesión única y cliente HTTP único en el frontend

## Intención

El frontend habla con la API de 5 maneras distintas: 74 `fetch(`, 15 imports directos de `axios`, un axios instance que nadie usa, 50 `localhost:5001` hardcodeados en 47 archivos y 3 lugares que leen `VITE_API_URL`. Además hay dos sesiones paralelas (`token` y `adminToken`). Consecuencias:

- Un build de producción no funciona.
- La mayoría de las mutaciones del admin no envían token.
- El checkout crea el pedido sin Authorization (`useCheckoutForm.js:248` manda `usuario?.token`, que no existe).
- El logout del admin no revoca el acceso.
- Cualquier usuario con *un* módulo entra a todo `/admin/*`.

Este change crea **un** cliente HTTP y **una** sesión, migra todas las llamadas a módulos `api.ts` por feature y aplica el control de acceso por módulo en las rutas del admin. Es requisito de `hardening-seguridad`: el backend no se puede proteger mientras el front no envíe el token.

## ¿Cambia comportamiento observable?

Sí, de forma acotada:

| Hoy | Después |
|---|---|
| Admin y tienda tienen sesiones separadas (`adminToken`/`adminUser` vs `token`/`usuario`) | Una sola sesión (`token`/`usuario`). Entrar por `/admin/login` también te deja logueado en la tienda, y salir en cualquiera de los dos cierra ambos |
| Muchas requests van sin `Authorization` | Toda request lleva el token si hay sesión. Contra el backend actual no cambia nada, porque hoy ignora el header en esas rutas |
| Un `401` se maneja (o no) en cada pantalla | Un `401` con sesión activa cierra la sesión y redirige a `/login` (o a `/admin/login` desde el admin) |
| Con un módulo cualquiera se entra a cualquier pantalla del admin escribiendo la URL | Cada ruta del admin exige su módulo; sin él, redirige a la primera pantalla permitida |
| `/api/permisos/me/modulos` se pide 3 veces por carga del admin | Una vez por sesión (cacheado) |
| Las URLs de imágenes se arman a mano con `localhost` | `assetUrl()` desde `VITE_API_URL` |

Ningún endpoint del backend cambia de contrato. El único cambio en el backend es un parche de compatibilidad: `cliente.controller.ts:18,119` lee `payload.id`, pero el token que guarda el front (el del OTP) trae `userId`. Hoy `GET /api/clientes/me` responde 401 y la pantalla lo ignora; con el manejo de 401 de este change, ese 401 cerraría la sesión de todo cliente que abra su perfil. El controller pasa a leer `payload.userId ?? payload.id`, y `hardening-seguridad` lo reemplaza por `req.user`.

## Alcance

### Incluido

- `src/shared/api/client.ts` (axios único) y `src/shared/api/assets.ts`.
- `src/shared/auth/session.ts` (store de sesión) con migración automática de las claves legacy.
- `UsuarioProvider` pasa a ser un wrapper de React sobre `session`, con la misma API pública.
- Hook `usePermisos()` con caché por sesión; `AdminRoute` con control por módulo; `Sidebar` y `Dashboard` leen del mismo hook.
- Migración de **todas** las llamadas HTTP a `src/features/<feature>/api.ts` (y `src/features/admin/<recurso>/api.ts`).
- Barrera en CI: 0 `fetch(`, 0 `localhost:` y 0 `import axios` fuera de `src/shared/api/` (allí viven el fallback de desarrollo y los orígenes legacy de `assetUrl`).

### Excluido

- Mover los componentes a `src/features/` (eso es `frontend-base-features` y los changes de cada contexto). Aquí solo se crean los `api.ts`.
- Cambios de endpoints o de payloads (los hace `hardening-seguridad`, que actualiza los `api.ts` afectados).
- Partir los componentes gigantes y unificar validaciones.

## Capacidades

### Nuevas

- `cliente-http`: un único cliente con base URL configurable, token automático y errores normalizados.
- `sesion-frontend`: una única sesión persistida, con login, logout y expiración.
- `acceso-panel-admin`: control de acceso por módulo en las rutas del admin.

## Enfoque

1. **Primero la infraestructura, con tests** (`client.ts`, `assets.ts`, `session.ts`, `usePermisos`). Todavía sin consumidores.
2. **`UsuarioProvider` sobre `session`**, manteniendo su API (`usuario`, `login`, `logout`, `getToken`, `isAuthenticated`, `getAuthHeaders`, `reloadUserFromStorage`, `refrescarUsuarioDesdeAPI`) para no romper a los 30+ consumidores.
3. **Migración por áreas** (auth → tienda/checkout/perfil → admin). Cada pantalla deja de construir URLs y headers y llama a funciones de su `api.ts`.
4. **Barrera final** en CI para que no vuelvan las llamadas directas.

## Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `src/shared/api/`, `src/shared/auth/` | Nuevo | Cliente, assets, sesión, permisos |
| `src/context/userContext.jsx` | Modificado | Wrapper sobre `session` |
| `src/components/AdminRoute.jsx`, `src/admin/components/{Sidebar,Dashboard,AdminLogin,Header}.jsx`, `src/admin/menuConfig.js` | Modificado | Sesión única, control por módulo, `getAdminInfo` desde la sesión |
| `src/features/*/api.ts` | Nuevo | Una función por endpoint |
| 41 archivos con llamadas HTTP + 2 hooks del checkout | Modificado | Usan el `api.ts` de su feature |
| `.github/workflows/frontend.yml` | Modificado | Barrera con grep |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Una pantalla deja de funcionar por un detalle de payload (fetch y axios serializan distinto, sobre todo `FormData` en productos) | Media | Test del `api.ts` de productos con `FormData`; checklist manual por pantalla en `tasks.md` |
| Un 401 que hoy se ignora pasa a cerrar la sesión | Media | Inventario de los 401 "normales" del backend actual: el único encontrado es `/api/clientes/me` y se corrige con el parche de compatibilidad. Los tokens vencidos hoy responden 403 (`verificarToken.ts:20`), así que la redirección por vencimiento recién actúa con `hardening-seguridad` |
| La redirección por 401 entra en bucle en las pantallas de login | Baja | Solo redirige si la request llevó token (HTTP.5) |
| Usuarios con `adminToken` guardado pierden la sesión | Baja | Migración automática de las claves legacy (SES.3) |
| Sesión única: alguien usaba admin y cliente con cuentas distintas en el mismo navegador | Baja | Comportamiento declarado. Si hace falta, se usa otro perfil del navegador |

## Plan de rollback

1. Cada work unit es un PR revertible.
2. Los PRs se revierten en orden inverso (admin → tienda → auth → infraestructura). Ningún dato del servidor cambia, así que el rollback solo afecta al bundle del front. Como mucho, los usuarios tendrán que volver a iniciar sesión.

## Dependencias

- `estabilizar-base`: tooling de tests del front, `tsconfig` con `allowJs`, workflow `frontend.yml` y borrado del axios instance muerto.

## Criterios de éxito

- [ ] `grep -rnE "fetch\(|localhost:[0-9]|from ['\"]axios['\"]" src | grep -v '^src/shared/api/'` → 0 resultados.
- [ ] En el navegador, todas las requests con sesión llevan `Authorization`.
- [ ] Login de admin → logout → `/admin/dashboard` redirige a `/admin/login`.
- [ ] Un usuario solo con `PRODUCTOS` no puede abrir `/admin/usuarios` escribiendo la URL.
- [ ] Un checkout completo crea el pedido con `Authorization`.
- [ ] Un cliente abre su perfil y sigue con la sesión iniciada (`/api/clientes/me` → 200).
- [ ] `npm test` en verde, con tests de `client`, `session`, `assets` y `usePermisos`.
