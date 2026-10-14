# Build y despliegue — Especificación (delta)

## Propósito

El backend y el frontend compilan, el backend valida su configuración al arrancar, y ambos se verifican y despliegan desde CI en la raíz del monorepo.

## ADDED Requirements

### Requirement: Compilación estricta del backend

El backend MUST compilar con `tsc --noEmit` sin errores, y el CI MUST fallar ante cualquier error de tipos.

#### Scenario: BUILD.1 — Typecheck limpio

- GIVEN el código de la rama
- WHEN se ejecuta `npx tsc --noEmit` en `TiendasMassBack-main`
- THEN el comando termina con código 0

#### Scenario: BUILD.2 — PR con error de tipos

- GIVEN un PR que introduce un error de tipos en el backend
- WHEN corre el workflow `backend.yml`
- THEN el job `verify` falla
- AND el deploy no se ejecuta

### Requirement: Configuración validada al arrancar

El backend MUST validar las variables de entorno con un esquema Zod antes de conectarse a la base de datos o abrir el puerto. Si una variable obligatoria falta o es inválida, el proceso MUST terminar con código distinto de 0 y un mensaje que la nombre. El código de aplicación SHOULD leer la configuración desde `env`, no desde `process.env`.

#### Scenario: CONF.1 — Falta una variable obligatoria

- GIVEN `DB_HOST` no está definida
- WHEN arranca el servidor
- THEN el proceso termina con código 1
- AND el mensaje incluye `DB_HOST`
- AND no se abre ningún puerto

#### Scenario: CONF.2 — Llaves JWT desde el entorno

- GIVEN `JWT_PRIVATE_KEY_B64` y `JWT_PUBLIC_KEY_B64` contienen PEM en base64
- WHEN el servidor firma y verifica un token
- THEN usa esas llaves
- AND no lee `src/keys/`

#### Scenario: CONF.3 — Fallback a archivos en desarrollo

- GIVEN `NODE_ENV=development`
- AND no hay variables `JWT_*_B64`
- AND existen `src/keys/private.key` y `src/keys/public.key`
- WHEN arranca el servidor
- THEN usa los archivos

#### Scenario: CONF.4 — Producción sin llaves

- GIVEN `NODE_ENV=production`
- AND no hay variables `JWT_*_B64`
- WHEN arranca el servidor
- THEN el proceso termina con código 1 y no intenta leer archivos

#### Scenario: CONF.5 — Orígenes CORS desde el entorno

- GIVEN `CORS_ORIGINS="https://a.example,https://b.example"`
- WHEN llega una petición con `Origin: https://a.example`
- THEN la respuesta incluye `Access-Control-Allow-Origin: https://a.example`
- AND con `Origin: https://c.example` la respuesta NO incluye ese header

### Requirement: Secretos propios del proyecto

Las llaves JWT, `JWT_SECRET` y las credenciales de MercadoPago MUST ser propias de este proyecto, y MUST NOT coincidir con las publicadas en el repo público del equipo original (`GG-IM/TIENDAS_MASS_ADMIN`), del que se copió el código. Producción SHOULD usar un par de llaves distinto del de desarrollo. La comparación se hace por huella o por hash, nunca mostrando valores.

#### Scenario: CONF.6 — Llave pública distinta de la publicada

- GIVEN la llave pública que usa un entorno (local o producción)
- WHEN se calcula `openssl pkey -pubin -in public.key -outform DER | sha256sum`
- THEN la huella NO es `213399b8806768dc83638c21acbd610cb99e98b95b55d0118ad7e945deda20da`

### Requirement: CI/CD desde la raíz del monorepo

Los workflows MUST estar en `.github/workflows/` de la raíz y filtrar por la ruta de cada app. Cada PR a `main` MUST ejecutar la verificación de la app que modifica. El deploy MUST ejecutarse solo en push a `main` o a mano (`workflow_dispatch`), y solo si la verificación pasó.

#### Scenario: CI.1 — PR que solo toca el frontend

- GIVEN un PR que modifica solo archivos de `TiendasMassFront-main/`
- WHEN se abre el PR
- THEN corre `frontend.yml`
- AND `backend.yml` no corre

#### Scenario: CI.2 — Verificación del backend

- GIVEN un PR que modifica `TiendasMassBack-main/`
- WHEN corre `backend.yml`
- THEN ejecuta en orden: `npm ci`, `npx tsc --noEmit`, `npm test` contra un servicio MySQL 8 y `npm run build`

#### Scenario: CI.3 — Verificación del frontend

- GIVEN un PR que modifica `TiendasMassFront-main/`
- WHEN corre `frontend.yml`
- THEN ejecuta `npm ci`, `npm test` y `npm run build` con `VITE_API_URL` tomado de una variable del repositorio
- AND `npm run lint` corre en modo informativo, sin bloquear

#### Scenario: CI.4 — Deploy en push a main

- GIVEN un push a `main` que modifica `TiendasMassBack-main/`
- WHEN la verificación pasa
- THEN se despliega a la Web App `tienditamassback`

### Requirement: Sin artefactos generados en git

Los directorios `test-results/`, `coverage/` y `dist/` MUST NOT estar versionados.

#### Scenario: GIT.1 — Artefactos ignorados

- GIVEN que se ejecutaron tests y build en ambas apps
- WHEN se corre `git status`
- THEN no aparecen archivos dentro de `test-results/`, `coverage/` ni `dist/`
