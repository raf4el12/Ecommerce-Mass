# Propuesta: Estabilizar la base (build, configuración, CI, tests y código muerto)

## Intención

Hoy el backend no compila (`npx tsc` falla), una petición con datos inválidos tumba el proceso, el deploy no corre desde el monorepo y no hay ninguna red de tests. Ningún refactor puede arrancar así. Este change deja una base que compila, arranca con configuración validada, se verifica en CI y tiene la infraestructura de tests que usarán todos los changes siguientes. También borra el código muerto, para no migrar después lo que nadie usa.

## ¿Cambia comportamiento observable?

Solo corrige defectos. No cambia ningún endpoint, payload ni pantalla.

| Hoy | Después |
|---|---|
| `POST/PUT /api/products` con body inválido dispara un `TypeError` no manejado y el proceso cae | Responde `400` con el detalle de la validación y el proceso sigue vivo |
| El backend lee las llaves JWT de `src/keys/*.key` (fuera de git): en CI/Azure caería al arrancar | Lee las llaves de variables de entorno. En desarrollo sigue funcionando el fallback a `src/keys` |
| Variables de entorno sin validar, con valores de respaldo inseguros (`root/root`) | El proceso no arranca si falta una variable obligatoria y dice cuál |
| Orígenes de CORS hardcodeados (el de ngrok con un espacio al final, nunca coincide) | Orígenes desde `CORS_ORIGINS`, con el mismo default local de hoy |

## Alcance

### Incluido

- Corregir el error TS2769 en `src/services/kardex.service.ts:98`.
- Corregir `src/middlewares/validate.ts` (Zod 4 expone `issues`, no `errors`) y evitar que sus errores escapen.
- Separar `src/app.ts` (`createApp()`, sin `listen`) de `src/server.ts` (env → DB → seed `TipoCliente` → `listen`).
- Crear `src/core/config/env.ts` (Zod). Llaves JWT por entorno (`JWT_PRIVATE_KEY_B64`, `JWT_PUBLIC_KEY_B64`), `CORS_ORIGINS` y `NODE_ENV` obligatorio.
- Backend: vitest (transformando con SWC para que TypeORM reciba la metadata de decoradores) + supertest + base de datos de test `tiendasmass_test` + smoke tests.
- Frontend: bloque `test` en `vite.config.js`, jsdom + Testing Library, `tsconfig.json` con `allowJs` (ADR-11). `typescript` pasa a devDependencies y se quita `mercadopago` (SDK de Node) de las dependencias del front.
- Workflows en `.github/workflows/` de la raíz, con filtros por ruta: verificación en cada PR y deploy en push a `main`.
- Borrar el código muerto verificado (23 archivos del front, 6 del backend, el montaje duplicado de `tarjetas-usuario` y las dependencias sin uso) y sacar `test-results/` de git.

### Excluido

- Cualquier cambio de autenticación o permisos → `hardening-seguridad`.
- Los 62 errores de ESLint → `limpieza-final`. En CI, el lint queda informativo (no bloquea).
- Migraciones y `synchronize` → `migraciones-bd`.
- Las entidades `Empleado` y `Reporte`, porque tienen relaciones con otras entidades → `migraciones-bd` y `contexto-identidad`.

## Capacidades

### Nuevas

- `build-y-despliegue`: el repo compila, valida su configuración, se verifica y se despliega desde CI.
- `pruebas-automatizadas`: infraestructura de tests ejecutable en ambas apps.

### Modificadas

- `validacion-entrada`: un error de validación responde 400 sin afectar al proceso.

## Enfoque

1. **Build verde primero** (el change más chico posible): el fix de tipos y el de `validate.ts`, cada uno con un test que lo fija.
2. **Separar la app del servidor** para poder probarla con supertest sin abrir un puerto.
3. **Configuración como código:** un solo módulo `env.ts` validado con Zod. El resto del código lee `env`, no `process.env`. En este change solo migran los consumidores de llaves JWT, CORS y DB; los demás `process.env` se migran en `core-backend`.
4. **CI en la raíz:** dos workflows (`backend.yml`, `frontend.yml`) con `paths:` y `defaults.run.working-directory`.
5. **Borrado mecánico de código muerto**, después de confirmar con grep que nadie importa cada archivo, y verificado con el build y los tests.

## Áreas afectadas

| Área | Impacto | Descripción |
|---|---|---|
| `TiendasMassBack-main/src/services/kardex.service.ts` | Modificado | Fix de tipos |
| `TiendasMassBack-main/src/middlewares/validate.ts` | Modificado | Zod 4 + manejo de errores |
| `TiendasMassBack-main/src/app.ts` · `src/server.ts` | Modificado / Nuevo | `createApp()` separado de la inicialización |
| `TiendasMassBack-main/src/core/config/env.ts` | Nuevo | Configuración validada |
| `src/middlewares/verificarToken.ts`, `src/controllers/auth.controller.ts`, `src/controllers/usuarios.controller.ts`, `src/config/data-source.ts` | Modificado | Leen llaves y DB desde `env` |
| `TiendasMassBack-main/package.json` · `vitest.config.ts` · `test/` | Modificado / Nuevo | Scripts e infraestructura de tests |
| `TiendasMassFront-main/vite.config.js` · `tsconfig.json` · `package.json` | Modificado / Nuevo | Tooling de tests y TypeScript incremental |
| `.github/workflows/backend.yml` · `frontend.yml` | Nuevo | CI/CD desde la raíz |
| `TiendasMass*-main/.github/` | Borrado | Workflows que nunca se ejecutaban |
| 29 archivos muertos + `test-results/` | Borrado | Ver `design.md` §6 |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El deploy falla porque faltan secrets en `raf4el12/Ecommerce-Mass` (los workflows venían de otros repos) | Alta | Tarea MANUAL de configurar secrets y app settings antes del primer deploy. El deploy se dispara a mano (`workflow_dispatch`) la primera vez |
| `npm start` deja de funcionar al pasar el entrypoint a `dist/server.js` | Media | Actualizar `main`/`start`/`dev` en el mismo commit |
| Se borra un archivo que se carga de forma dinámica | Baja | grep de imports, `url()` en CSS y `index.html`, `npm run build` y navegación manual por las rutas principales |
| La base de test pisa la de desarrollo | Baja | `test/setup` aborta si `DB_NAME` no termina en `_test` |

## Plan de rollback

1. Cada work unit es un PR independiente; se revierte con `git revert`.
2. Workflows: borrar `.github/workflows/*.yml`. Los anteriores no ejecutaban nada, así que no se pierde nada.
3. Llaves JWT: el fallback a `src/keys` en desarrollo sigue existiendo. En Azure basta con volver a subir los archivos de llaves.
4. Código muerto: `git revert` del commit de borrado.

## Dependencias

- Ninguna con otros changes.
- Acceso de administrador al repositorio de GitHub y al portal de Azure (tareas MANUAL).
- ~~Commitear antes los cambios locales pendientes~~: hecho en `660ed4b` y `3d25d36`.

## Criterios de éxito

- [ ] `npx tsc --noEmit` termina con 0 en el backend.
- [ ] `npm test` en verde en el backend (smoke tests) y en el frontend (los 47 tests existentes + 1 test de componente).
- [ ] `POST /api/products` con un body inválido responde 400 y luego `GET /health` responde 200.
- [ ] Un PR a `main` dispara solo el workflow de la app que tocó; un push a `main` despliega (después de la tarea MANUAL).
- [ ] No queda ningún archivo de la lista de código muerto; `npm run build` del front pasa.
