# Tareas: Estabilizar la base

## Pronóstico de revisión

| Campo | Valor |
|---|---|
| Líneas cambiadas estimadas | ~900 (de las cuales ~2.400 son borrados mecánicos, fuera del presupuesto) |
| Riesgo frente al presupuesto de 400 líneas | Medio |
| PRs encadenados | Sí, 4 |
| Estrategia | Un PR por work unit; el WU4 lleva `size:exception` (solo borrados) |

### Work units

| Unidad | Objetivo | PR | Notas |
|---|---|---|---|
| WU1 | Build verde + `createApp` + tests del backend | PR 1 | Base para todo lo demás |
| WU2 | `env.ts` + llaves JWT + CORS + CI/CD | PR 2 | Incluye tareas MANUAL |
| WU3 | Tooling del frontend | PR 3 | Puede ir en paralelo con WU2 |
| WU4 | Borrado de código muerto | PR 4 | Solo borrados; requiere WU1 y WU3 para verificar |

## Fase 0: Preparación

- [ ] 0.1 Commitear por separado los cambios locales pendientes (`docker-compose.yml`, `package.json`, `src/scripts/seed.ts`, `seed_80.ts`, `update_images.ts` y las imágenes nuevas) para no mezclarlos con este change.
- [ ] 0.2 Verificar que `docker compose up -d` levanta MySQL y que `npm run dev` arranca. Anotar el estado inicial en `state.yaml`.

## Fase 1 (WU1): Build verde y tests del backend

- [ ] 1.1 **IMPL**: `src/services/kardex.service.ts:98`: `usuario: usuario ?? undefined`.
- [ ] 1.2 **VERIFY**: `npx tsc --noEmit` → 0 (BUILD.1).
- [ ] 1.3 **IMPL**: Separar `src/app.ts` en `createApp()` y crear `src/server.ts` (inicialización de DB, `seedTipoCliente` y `listen`). Actualizar `main`, `start` y `dev` en `package.json`.
- [ ] 1.4 **VERIFY**: `npm run dev`; `curl localhost:5001/health` → 200; `curl localhost:5001/api/products` → 200.
- [ ] 1.5 **IMPL**: Instalar `vitest`, `supertest`, `@types/supertest` y `vite-tsconfig-paths`. Crear `vitest.config.ts`, `.env.test` y `test/setup/{env,db}.ts` con el guard `_test` y llaves RSA efímeras, y `test/helpers/{resetDb,http}.ts`. Script `test` = `vitest run`.
- [ ] 1.6 **TEST**: `test/smoke/health.test.ts`: `GET /health` → 200 sin `listen` (TEST.3).
- [ ] 1.7 **TEST**: `test/smoke/productos.test.ts`: `GET /api/products` → 200 (contrato actual); `POST /api/products` con `precio: "abc"` → 400 con `details` (VAL.1); después, `GET /health` → 200 (VAL.2). Debe fallar antes de 1.8.
- [ ] 1.8 **IMPL**: Reescribir `src/middlewares/validate.ts` según `design.md` §2.
- [ ] 1.9 **TEST**: `test/smoke/validate.test.ts`: un esquema que lanza `Error` genérico → 500 JSON (VAL.3).
- [ ] 1.10 **VERIFY**: `npm test` en verde. Correrlo a mano con `DB_NAME=tiendasmass` y confirmar que aborta (TEST.1). Confirmar TEST.2 con dos archivos que insertan datos.

## Fase 2 (WU2): Configuración y CI/CD

- [ ] 2.1 **TEST**: `test/unit/env.test.ts`: parseo con variables faltantes → error que nombra `DB_HOST` (CONF.1); llaves `*_B64` → PEM decodificado (CONF.2); development sin `*_B64` → lectura de archivos (CONF.3); production sin `*_B64` → error (CONF.4).
- [ ] 2.2 **IMPL**: `src/core/config/env.ts` según `design.md` §4 (separar `parseEnv(raw)`, que es puro, de `env`, que hace `exit`).
- [ ] 2.3 **IMPL**: Migrar a `env` los consumidores: `config/data-source.ts`, `middlewares/verificarToken.ts`, `controllers/auth.controller.ts` y `controllers/usuarios.controller.ts`.
- [ ] 2.4 **TEST**: `test/smoke/cors.test.ts` (CONF.5).
- [ ] 2.5 **IMPL**: CORS en `createApp()` desde `env.corsOrigins`.
- [ ] 2.6 **IMPL**: Actualizar `.env.example` (`NODE_ENV`, `CORS_ORIGINS`, `JWT_*_B64` con el comando para generarlas; `JWT_SECRET` marcado como obsoleto).
- [ ] 2.7 **IMPL**: Crear `.github/workflows/backend.yml` y `frontend.yml` según `design.md` §7, y `TiendasMassFront-main/public/staticwebapp.config.json`.
- [ ] 2.8 **IMPL**: Borrar `TiendasMassBack-main/.github/` y `TiendasMassFront-main/.github/`.
- [ ] 2.9 **MANUAL**: Configurar los secrets y variables en GitHub y las app settings en Azure (`design.md` §7). Definir la URL pública del backend para `VITE_API_URL`.
- [ ] 2.10 **VERIFY**: Abrir el PR y confirmar que solo corre `backend.yml` (CI.1 y CI.2). Tras el merge, primer deploy con `workflow_dispatch` (CI.4). Probar `/health` en Azure.

## Fase 3 (WU3): Tooling del frontend

- [ ] 3.1 **IMPL**: Agregar el bloque `test` a `vite.config.js`. Instalar `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event`. `tests/setup/vitest.setup.js` ya importa `@testing-library/jest-dom/matchers` y `cleanup`; hoy no se carga porque no hay bloque `test` y esas dependencias no están instaladas.
- [ ] 3.2 **TEST**: `tests/unit/Button.test.jsx`: renderiza `components/ui/Button.jsx` y usa `toBeInTheDocument` (TEST.5).
- [ ] 3.3 **IMPL**: `tsconfig.json` con `allowJs` y script `typecheck`. Pasar `typescript` a devDependencies y quitar `mercadopago` de las dependencias.
- [ ] 3.4 **IMPL**: `git rm -r --cached test-results` y agregar `test-results/`, `coverage/` y `.env` al `.gitignore` del front (GIT.1).
- [ ] 3.5 **VERIFY**: `npm test` (47 tests + 1 nuevo; TEST.4) y `npm run build`.

## Fase 4 (WU4): Código muerto

- [ ] 4.1 **VERIFY**: Repetir el grep de importadores para cada archivo de `design.md` §6. Si alguno tiene importadores, sacarlo de la lista y anotarlo.
- [ ] 4.2 **IMPL**: Borrar los 23 archivos del front y la línea comentada `GestionProducto.jsx:25`. Identificar con el mismo grep las imágenes sin uso de `src/assets/` y borrarlas.
- [ ] 4.3 **IMPL**: Borrar los 6 archivos del backend, la línea duplicada `app.ts:81` y las dependencias `bcrypt`, `@types/bcrypt`, `node` y `tsyringe`. Pasar `@types/express` a devDependencies.
- [ ] 4.4 **VERIFY**: Backend `npx tsc --noEmit && npm test`. Front `npm test && npm run build`. Navegar a mano: home, catálogo, login + OTP, checkout hasta la preferencia, perfil y panel admin (dashboard, productos, categorías).

## Fase 5: Cierre

- [ ] 5.1 Actualizar `CLAUDE.md` (entrypoint `server.ts`, `npm test` en ambas apps, CI en la raíz).
- [ ] 5.2 Barrido de patrones: buscar en todo el diff otras ocurrencias de `zodError.errors` y de `fs.readFileSync(… 'keys' …)`.
- [ ] 5.3 Escribir `verify-report.md`, mover el change a `archive/` y actualizar la tabla de progreso del roadmap.
