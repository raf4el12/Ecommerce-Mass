# Acceso al panel admin — Especificación (delta)

## Propósito

Cada pantalla del panel admin exige el módulo que le corresponde, a partir de una sola fuente de verdad (ruta → módulo) y de una sola consulta de permisos por sesión.

> El control real lo hace el backend (`hardening-seguridad`). Este control evita mostrar pantallas que el backend va a rechazar, y deja de dar acceso total a quien tiene un solo módulo.

## ADDED Requirements

### Requirement: Fuente única ruta → módulo

La relación entre ruta del admin, módulo, etiqueta e ícono MUST definirse solo en `src/admin/menuConfig.js`. `AdminRoute`, `Sidebar`, `Dashboard` y `PublicHeader` MUST derivarla de ahí.

#### Scenario: ADM.1 — Sin duplicados

- GIVEN el código del change
- WHEN se busca un mapa ruta → módulo fuera de `menuConfig.js`
- THEN no existe ninguno (hoy hay una copia en `Dashboard.jsx:74-84` a la que le faltan `PERMISOS` y `KARDEX`)

### Requirement: Permisos cacheados por sesión

`usePermisos()` MUST pedir `GET /api/permisos/me/modulos` como máximo una vez por sesión y compartir el resultado entre componentes. La caché MUST invalidarse con `logout()`.

#### Scenario: ADM.2 — Una sola consulta

- GIVEN una sesión recién iniciada
- WHEN se carga `/admin/dashboard` (hoy `AdminRoute`, `Sidebar` y `Dashboard` hacen una llamada cada uno)
- THEN se hace exactamente una request a `/api/permisos/me/modulos`

### Requirement: Control por módulo en cada ruta

`AdminRoute` MUST permitir una ruta del admin solo si el usuario tiene su módulo. Si no lo tiene, MUST redirigir a la primera ruta del menú que sí tenga. Si no tiene ninguna, MUST redirigir a `/`.

#### Scenario: ADM.3 — Usuario con un solo módulo

- GIVEN un usuario cuyos módulos son `["PRODUCTOS"]`
- WHEN navega directo a `/admin/usuarios`
- THEN es redirigido a `/admin/productos`

#### Scenario: ADM.4 — Sin sesión

- GIVEN que no hay sesión
- WHEN navega a cualquier `/admin/*` distinta de `/admin/login`
- THEN es redirigido a `/admin/login`

#### Scenario: ADM.5 — Sidebar coherente

- GIVEN un usuario con módulos `["PRODUCTOS", "PEDIDOS"]`
- WHEN ve el sidebar
- THEN solo aparecen las entradas cuyo módulo está en esa lista

#### Scenario: ADM.6 — Setup pendiente (sin cambios)

- GIVEN que `GET /api/setup/status` responde `needsSetup: true`
- WHEN se navega a `/admin`
- THEN se muestra `SetupAdmin`, igual que hoy
