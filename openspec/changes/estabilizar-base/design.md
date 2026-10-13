# Diseño: Estabilizar la base

## Enfoque técnico

Cinco piezas independientes que se entregan en cuatro work units (ver `tasks.md`):

1. **Build verde:** fix de tipos en el kardex y fix de `validate.ts`.
2. **Testabilidad:** `createApp()` separado de `server.ts`, más la infraestructura de vitest/supertest con una DB `_test`.
3. **Configuración:** `src/core/config/env.ts` con Zod. Las llaves JWT, la DB y CORS pasan a leerse desde `env`.
4. **CI/CD:** workflows en la raíz con filtros por ruta.
5. **Higiene:** borrado de código muerto, tooling de tests y TypeScript incremental en el front.

## Decisiones

| Decisión | Elegida | Alternativas | Rationale |
|---|---|---|---|
| Formato de las llaves JWT en el entorno | PEM en base64 (`JWT_PRIVATE_KEY_B64`, `JWT_PUBLIC_KEY_B64`) | PEM con `\n` escapados; archivo montado | El portal de Azure y los secrets de GitHub manejan mal los valores multilínea; base64 no tiene ambigüedad |
| Fallback a `src/keys/` | Solo con `NODE_ENV=development` | Siempre; nunca | En local no hay que configurar nada nuevo. En producción, fallar es preferible a usar llaves olvidadas en el disco |
| Llaves en tests | El setup genera un par RSA efímero (`crypto.generateKeyPairSync`) | Secrets de CI con llaves de test | No hay secretos que mantener y cada corrida es independiente |
| DB de test | `tiendasmass_test` en el mismo contenedor MySQL (local) y en un servicio `mysql:8.0` (CI). `synchronize: true` solo hasta `migraciones-bd` | Contenedor separado; SQLite | El mismo motor que producción. MySQL y SQLite difieren en enums y decimales |
| Paralelismo de vitest en el backend | `fileParallelism: false` | Una DB por worker | Simple y suficiente con el tamaño actual de la suite. Se revisa si pasa de ~1 min |
| Lint en CI | Informativo (`continue-on-error`) hasta `limpieza-final` | Bloqueante ya | Hoy hay 62 errores; bloquear frenaría todos los changes intermedios |
| Deploy del front | Build en el job `verify` y deploy de `dist/` con `skip_app_build: true` | Dejar que Oryx (Azure) haga el build | Un solo build, con el `VITE_API_URL` correcto y ya verificado |
| tsyringe | Se elimina junto con `src/core/container.ts` (sin uso) | Mantenerlo hasta `core-backend` | ADR-03. Hoy es código muerto; `reflect-metadata` se queda porque lo usa TypeORM |
| Transformación de TS en vitest | `unplugin-swc` + `@swc/core` con `decoratorMetadata: true` | El esbuild por defecto de vitest | esbuild no emite `design:type`. TypeORM lanza `ColumnTypeUndefinedError` con cada `@Column()` sin `type` explícito (p. ej. `Categoria.entity.ts:17`, `Cliente.entity.ts:30`), así que la suite no arrancaría |
| Arranque del servidor | `server.ts` con imports estáticos y `async function main()` | `await` de nivel superior + `import()` dinámico | El backend compila a CommonJS (`module: Node16` sin `"type": "module"`): el `await` de nivel superior da TS1309 y el `import()` dinámico queda nativo, sin `tsconfig-paths` |

## 1. Fix de tipos (`kardex.service.ts:98`)

`usuario` se declara `let usuario = null` y se asigna `Usuario | null`. `DeepPartial<Kardex>` acepta `undefined`, no `null`.

```ts
const nuevoKardex = transactionalEntityManager.create(Kardex, {
  // …
  usuario: usuario ?? undefined,
});
```

## 2. `validate.ts`

```ts
export const validate = (schema: ZodTypeAny): RequestHandler => (req, res, next) => {
  schema
    .parseAsync({ body: req.body, query: req.query, params: req.params })
    .then(() => next())
    .catch((error) => {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid data',
          details: error.issues.map((issue) => ({
            message: `${issue.path.join('.')} is ${issue.message}`,
          })),
        });
        return;
      }
      next(error);
    });
};
```

- Zod 4.4: `ZodError#issues` existe; `#errors` es `undefined`. Verificado con `node -e` contra el `node_modules` del backend.
- El handler deja de ser `async`, así ningún error puede escapar como promesa rechazada.

## 3. `createApp()` y `server.ts`

```ts
// src/app.ts
export function createApp(): Express            // middlewares + routers + errorHandler. Sin DB ni listen.

// src/server.ts
import 'reflect-metadata';
import { env } from '@core/config/env';         // import estático: valida o termina el proceso al cargarse
import { AppDataSource } from './config/data-source';
import { createApp } from './app';

async function main() {
  await AppDataSource.initialize();
  await seedTipoCliente();                      // movido desde app.ts
  createApp().listen(env.PORT);
}
main().catch((error) => { console.error(error); process.exit(1); });
```

- `package.json`: `"main": "dist/server.js"`, `"start": "node dist/server.js"` y `"dev": "ts-node-dev … src/server.ts"`.
- Los endpoints `/`, `/health` y `/api/diagnostics` siguen en `createApp()`.
- `export default app` desaparece de `app.ts`. Ningún archivo lo importa hoy (verificado).

## 4. `src/core/config/env.ts`

```ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(5001),
  BASE_URL: z.string().url().default('http://localhost:5001'),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string(),                 // acepta DB_PASSWORD como alias (preprocess)
  DB_NAME: z.string().min(1),
  JWT_PRIVATE_KEY_B64: z.string().optional(),
  JWT_PUBLIC_KEY_B64: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174,http://localhost:3000'),
});

export const env = { ...parsed, corsOrigins: string[], jwt: { privateKey: string, publicKey: string } };
```

- Se separa `parseEnv(raw, { keysDir = 'src/keys' })` (pura, lanza un `Error` con la lista de problemas) de `env` (llama a `parseEnv(process.env)` y, si falla, imprime `Configuración inválida: DB_HOST (Required), …` y hace `process.exit(1)`; CONF.1).
- Llaves: si existen las `*_B64`, se decodifican. Si no, y `NODE_ENV === 'development'`, se leen `<keysDir>/private.key` y `<keysDir>/public.key`. En cualquier otro caso, error (CONF.2 a CONF.4). `keysDir` existe para que el test de CONF.3 use PEM temporales: `src/keys/*.key` no está en git (`.gitignore`: `*.key`) y no existe en CI.
- Consumidores migrados en este change: `verificarToken.ts:6`, `auth.controller.ts:10`, `usuarios.controller.ts:18`, `config/data-source.ts` (sin respaldos `root/root`) y la configuración de CORS en `app.ts`.
- Fuera de este change (siguen leyendo `process.env`, se migran en `core-backend`): MercadoPago, email y `adminAuth.middleware` (que se borra en `hardening-seguridad`).
- `.env.example` se actualiza con `NODE_ENV`, `CORS_ORIGINS`, `JWT_*_B64` (y cómo generarlas: `base64 -w0 src/keys/private.key`). `JWT_SECRET` se marca como obsoleto.

## 5. Infraestructura de tests del backend

```
TiendasMassBack-main/
├── vitest.config.ts          # plugins: unplugin-swc (decoratorMetadata) + vite-tsconfig-paths; fileParallelism: false; setupFiles
├── .env.test                 # NODE_ENV=test, DB_NAME=tiendasmass_test (sin secretos; versionado)
└── test/
    ├── setup/env.ts          # carga .env.test; aborta si DB_NAME no termina en _test (TEST.1);
    │                         # genera un par RSA efímero → JWT_*_B64
    ├── setup/db.ts           # beforeAll: crea la DB si no existe (mysql2) + AppDataSource.initialize()
    │                         # afterAll: destroy()
    ├── helpers/resetDb.ts    # SET FOREIGN_KEY_CHECKS=0; TRUNCATE de todas las tablas; seeds mínimos (TEST.2)
    ├── helpers/http.ts       # export const api = () => request(createApp())
    └── smoke/
        ├── health.test.ts        # TEST.3
        ├── productos.test.ts     # GET /api/products 200; VAL.1, VAL.2
        └── validate.test.ts      # VAL.3 (esquema que lanza un Error genérico)
```

- Dependencias de desarrollo: `vitest`, `supertest`, `@types/supertest`, `vite-tsconfig-paths`, `unplugin-swc`, `@swc/core`.
- `vitest.config.ts`: `swc.vite({ jsc: { parser: { syntax: 'typescript', decorators: true }, transform: { legacyDecorator: true, decoratorMetadata: true } } })`.
- `npm test` = `vitest run`; `npm run test:watch` = `vitest`.
- Seeds mínimos: `Estado` (Activo/Inactivo), `Rol` (admin, cliente), `TipoCliente` (NATURAL, JURIDICO). Son los mismos que asume el código actual.

## 6. Código muerto

Cada archivo se verificó sin importadores (búsqueda de `import … from '…/<nombre>'`, `url()` en CSS e `index.html`, a 2026-10-11). La tarea vuelve a verificar antes de borrar.

**Frontend (`TiendasMassFront-main/src/`), 23 archivos:**

```
components/ProtectedRoute.jsx            components/AccessibleModal.jsx
components/FormField.jsx                 components/SubcategoriaProductos.jsx
hooks/useKeyboardNavigation.js           hooks/useOTPAuth.js
hooks/usePermitedModulos.js              hooks/useProductos.js
services/api/axios.instance.js           services/api/productos.api.js
utils/accessibility.js                   utils/subcategoriaAPI.js
components/carousel/banner.jsx           components/carousel/banner.css
components/carousel/productCarousel.jsx  components/carousel/productcarousel.css
components/categoria/categoria.jsx       components/categoria/categoria.css
components/checkout/index.jsx            components/checkout/utils/paymentStatus.jsx
components/checkout/validations.jsx      data/mockData.jsx
fonts/CocogooseClassic.ttf
```

Notas:
- `GestionProducto.jsx:25` tiene el import de `mockData` comentado; se borra esa línea.
- `useCheckoutValidation.js` importa `../utils/validations` (el vivo, cubierto por tests), no `../validations`.
- Las imágenes sin uso de `src/assets/` se identifican en la tarea 4.2 con el mismo grep.

**Backend (`TiendasMassBack-main/src/`):**

```
services/subcategoria.service.ts     controllers/roles.controller.ts
routes/tarjeta.routes.ts             controllers/tarjeta.controller.ts
services/tarjeta.service.ts          core/container.ts
```

- `app.ts:80-81` monta `tarjetas-usuario` dos veces; se deja una sola línea.
- Dependencias a quitar de `package.json`: `bcrypt`, `@types/bcrypt`, `node` y `tsyringe`. `@types/express` pasa a devDependencies.

## 7. CI/CD

`.github/workflows/backend.yml`:

```yaml
on:
  pull_request: { branches: [main], paths: ['TiendasMassBack-main/**', '.github/workflows/backend.yml'] }
  push:         { branches: [main], paths: ['TiendasMassBack-main/**', '.github/workflows/backend.yml'] }
  workflow_dispatch:
defaults: { run: { working-directory: TiendasMassBack-main } }
jobs:
  verify:
    services:
      mysql: { image: mysql:8.0, env: { MYSQL_ROOT_PASSWORD: root, MYSQL_DATABASE: tiendasmass_test }, ports: ['3306:3306'],
               options: --health-cmd="mysqladmin ping -proot" --health-interval=5s --health-retries=20 }
    steps: checkout → setup-node 22 (cache: npm, cache-dependency-path: TiendasMassBack-main/package-lock.json)
           → npm ci → npx tsc --noEmit
           → npm test (env: DB_HOST=127.0.0.1, DB_USER=root, DB_PASS=root)
           → npm run build → npm prune --omit=dev → zip release.zip dist node_modules package.json
           → upload-artifact (path: TiendasMassBack-main/release.zip)   # los pasos `uses:` ignoran working-directory
  deploy:
    needs: verify
    if: github.event_name != 'pull_request'
    permissions: { id-token: write, contents: read }                    # login OIDC, como el workflow actual
    steps: download-artifact → unzip → azure/login@v2 (secrets AZUREAPPSERVICE_*) → azure/webapps-deploy@v3 (app-name: tienditamassback, package: .)
```

`.github/workflows/frontend.yml`:

```yaml
on: (igual, con paths TiendasMassFront-main/**)
jobs:
  verify: setup-node 22 (cache-dependency-path: TiendasMassFront-main/package-lock.json)
          → npm ci → npm test → npm run lint (continue-on-error: true)
          → npm run build (env: VITE_API_URL: ${{ vars.VITE_API_URL }}, VITE_MP_PUBLIC_KEY: ${{ vars.VITE_MP_PUBLIC_KEY }})
          → upload-artifact (path: TiendasMassFront-main/dist)
  deploy: (push/dispatch) download-artifact (path: dist)
          → Azure/static-web-apps-deploy@v1 con action: "upload", app_location: "dist", skip_app_build: true,
            azure_static_web_apps_api_token: secrets.AZURE_STATIC_WEB_APPS_API_TOKEN
```

**Política de deploy:** `main` despliega en cada push. Por eso, en los changes con varios work units, los PRs de cada unidad van a la rama `change/<nombre>` y esa rama entra a `main` con **un** merge (ver roadmap §7). Solo las unidades marcadas como desplegables por separado entran a `main` antes.

- Nuevo `TiendasMassFront-main/public/staticwebapp.config.json` con `navigationFallback` a `/index.html`. Sin él, recargar en `/admin/dashboard` da 404 en Azure Static Web Apps.
- Se borran `TiendasMassBack-main/.github/` y `TiendasMassFront-main/.github/`.

**MANUAL:** el usuario configura en GitHub los secrets `AZUREAPPSERVICE_CLIENTID`, `AZUREAPPSERVICE_TENANTID`, `AZUREAPPSERVICE_SUBSCRIPTIONID` y `AZURE_STATIC_WEB_APPS_API_TOKEN`, y las variables `VITE_API_URL` y `VITE_MP_PUBLIC_KEY`. En Azure, la Web App necesita las app settings `NODE_ENV=production`, `DB_*`, `JWT_*_B64` y `CORS_ORIGINS`, y el startup command `npm start`.

## 8. Tooling del frontend

- `vite.config.js`: bloque `test: { environment: 'jsdom', setupFiles: ['tests/setup/vitest.setup.js'], include: ['tests/**/*.test.{js,jsx,ts,tsx}', 'src/**/*.test.{js,jsx,ts,tsx}'] }`.
- Dependencias de desarrollo nuevas: `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
- `tsconfig.json`: `allowJs: true`, `checkJs: false`, `jsx: "react-jsx"`, `strict: true` (aplica solo a `.ts/.tsx`), `noEmit: true`, `moduleResolution: "bundler"`. Nuevo script `typecheck` (`tsc --noEmit`) que se suma al CI cuando exista el primer `.ts`.
- `typescript` pasa a devDependencies. Se quita `mercadopago`: es el SDK de Node y el front ya usa `@mercadopago/sdk-react`.
- `test-results/` sale de git y entra al `.gitignore` del front, junto con `.env` y `coverage/`.

## Archivos

| Archivo | Acción |
|---|---|
| `TiendasMassBack-main/src/services/kardex.service.ts` | Modificar |
| `TiendasMassBack-main/src/middlewares/validate.ts` | Modificar |
| `TiendasMassBack-main/src/app.ts` | Modificar (`createApp`, CORS desde env, sin seed, sin listen) |
| `TiendasMassBack-main/src/server.ts` | Crear |
| `TiendasMassBack-main/src/core/config/env.ts` | Crear |
| `TiendasMassBack-main/src/config/data-source.ts` | Modificar (lee `env`) |
| `TiendasMassBack-main/src/middlewares/verificarToken.ts`, `src/controllers/auth.controller.ts`, `src/controllers/usuarios.controller.ts` | Modificar (llaves desde `env`) |
| `TiendasMassBack-main/package.json`, `.env.example`, `.env.test`, `vitest.config.ts`, `test/**` | Modificar / Crear |
| 6 archivos del backend (§6) | Borrar |
| `TiendasMassFront-main/vite.config.js`, `tsconfig.json`, `package.json`, `.gitignore`, `public/staticwebapp.config.json` | Modificar / Crear |
| `TiendasMassFront-main/tests/unit/Button.test.jsx` | Crear (TEST.5) |
| 23 archivos del frontend (§6) + `test-results/` | Borrar |
| `.github/workflows/backend.yml`, `.github/workflows/frontend.yml` | Crear |
| `TiendasMassBack-main/.github/`, `TiendasMassFront-main/.github/` | Borrar |
| `CLAUDE.md` | Modificar (comandos `npm test`, entrypoint `server.ts`, CI) |

## Tests que acompañan el change

| Escenario | Test |
|---|---|
| BUILD.1 | `npx tsc --noEmit` en el job `verify` |
| BUILD.2 | Manual en el PR de WU2: un commit temporal con un error de tipos hace fallar `verify` (luego se revierte) |
| CONF.1 a CONF.4 | `test/unit/env.test.ts`: `parseEnv(raw, { keysDir })` con distintos objetos de entorno; CONF.3 escribe PEM temporales en `os.tmpdir()` |
| CONF.5 | `test/smoke/cors.test.ts` con supertest y el header `Origin` |
| VAL.1 a VAL.3 | `test/smoke/productos.test.ts`, `test/smoke/validate.test.ts` |
| TEST.1 a TEST.3 | `test/smoke/health.test.ts` + guard del setup (verificado a mano con `DB_NAME=tiendasmass`) |
| TEST.4, TEST.5 | `npm test` del front |
| CI.1 a CI.4, GIT.1 | Verificación manual en el primer PR (anotar en `verify-report.md`) |

## Preguntas abiertas

- **URL pública del backend** para la variable `VITE_API_URL` del repo. Es un dato del usuario (tarea MANUAL), no bloquea el apply.
