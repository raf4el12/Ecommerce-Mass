# Roadmap de arquitectura — TiendasMass (v2)

> **Versión:** 2 — 2026-10-11. Reemplaza al roadmap v1 (2026-06-08), que planteaba fases horizontales (repositorios → servicios → DI → tests).
> **Método:** Spec-Driven Development. Cada paso del plan es un *change* en `openspec/changes/<nombre>/` con `proposal.md`, `specs/`, `design.md`, `tasks.md` y `state.yaml`. Las convenciones del SDD están en `openspec/config.yaml`.
> **Objetivo:** dejar el sistema seguro, desplegable y organizado como un **monolito modular por bounded context**, con DDD solo donde hay reglas de negocio reales (ventas, inventario, pagos) y CRUD simple en el resto.

---

## Contenido

1. [Por qué se reescribió el plan](#1-por-qué-se-reescribió-el-plan)
2. [Principios](#2-principios)
3. [Mapa de bounded contexts](#3-mapa-de-bounded-contexts)
4. [Arquitectura objetivo](#4-arquitectura-objetivo)
5. [Decisiones de arquitectura (ADRs)](#5-decisiones-de-arquitectura-adrs)
6. [Plan de changes](#6-plan-de-changes)
7. [Cómo se trabaja un change](#7-cómo-se-trabaja-un-change)
8. [Qué no hacer](#8-qué-no-hacer)
9. [Progreso](#9-progreso)
10. [Apéndice A — Diagnóstico (2026-10-11)](#apéndice-a--diagnóstico-2026-10-11)

---

## 1. Por qué se reescribió el plan

**Estado real al 2026-10-11** (rama `refactor/clean-arch`):

| Área | Situación |
|---|---|
| Plan v1 | Solo la Fase 0 está hecha, y nada la usa: `src/modules/` vacío, `core/container.ts` sin registros, el alias `@core` usado en 1 archivo |
| Código nuevo | El kardex (`f5b812e`), escrito *después* de la Fase 0, siguió el patrón legacy: sin repositorio, sin Zod, sin auth y con `usuario_id` tomado del body |
| Build / deploy | `npx tsc` falla (`kardex.service.ts:98`). Los workflows de deploy están dentro de las subcarpetas, así que GitHub Actions nunca los ejecuta |
| Seguridad | Registro con `rolId` libre, hashes de password expuestos, casi todo el CRUD sin auth, pagos manipulables, XSS en el admin (detalle en el [Apéndice A](#apéndice-a--diagnóstico-2026-10-11)) |
| Backend | 108 referencias a `AppDataSource` en controllers. Solo 5 de 23 controllers usan un service. Dos formas de error (`{error}` ×131, `{message}` ×130). `synchronize: true` |
| Frontend | 74 `fetch(` y 50 `localhost:5001` en 47 archivos. 5 convenciones HTTP. ~2.083 líneas muertas. Componentes de hasta 857 líneas. 62 errores de ESLint |

**Por qué el plan v1 no servía:**

1. **No era Clean Architecture ni DDD.** Prohibía mover las entidades y sus repositorios devolvían entidades de TypeORM, así que el modelo de dominio seguía siendo el ORM. En la práctica era "capas + contenedor DI".
2. **Avanzaba en horizontal.** La Fase 1 creaba repositorios que nadie usaba ("Archivos a modificar: Ninguno"), y nada obligaba a que el código nuevo siguiera el patrón. El kardex lo demuestra.
3. **Dejaba los tests para el final.** Así, "no cambiar comportamiento" no se podía verificar.
4. **Ignoraba la seguridad y la congelaba.** Las reglas "no cambiar comportamiento" y "mantener rutas exactas" preservaban los huecos.
5. **Armaba un módulo por tabla (19)** en vez de por contexto, con un repositorio interfaz+impl por entidad: pura ceremonia.
6. **Excluía `synchronize: true`**, que es lo que vuelve riesgoso tocar cualquier entidad.

---

## 2. Principios

1. **Primero estabilidad y seguridad, después estructura.** Ningún refactor arranca con el build roto o con endpoints de pago abiertos.
2. **Slices verticales.** Un change migra un contexto completo (backend + frontend + tests) y se despliega solo. No hay pasadas horizontales sobre todo el código.
3. **Tests antes de mover código.** Cada change de contexto empieza con tests de integración HTTP que fijan el contrato actual (o el nuevo, si el spec lo cambia).
4. **DDD donde paga.** Agregados, value objects y casos de uso solo en `ventas`, `inventario` y `pagos`. El resto es CRUD plano sobre `Repository<T>`.
5. **Sin abstracciones preventivas.** Nada de interfaces sin un segundo consumidor real ni contenedores DI sin necesidad (en línea con las reglas globales de código del equipo).
6. **El comportamiento se preserva salvo lo que el spec declare.** Cada `proposal.md` dice explícitamente qué cambia de forma observable y por qué.
7. **Todo código nuevo va a la estructura objetivo** (`src/modules/`, `src/core/`, `src/features/`, `src/shared/`). Las carpetas legacy solo se tocan para vaciarlas.

---

## 3. Mapa de bounded contexts

| Contexto | Tipo | Absorbe (código actual) | Entidades |
|---|---|---|---|
| **identidad** | soporte | `auth`, `usuarios`, `rol`/`roles`, `permisos`, `setup`, `otp.service` | Usuario, Rol, Permiso, RolPermiso, OTP |
| **clientes** | soporte | `cliente`, `tipoCliente`, `direccion`, `tarjeta-usuario` | Cliente, Persona, Empresa, TipoCliente, Direccion, TarjetaUsuario |
| **catalogo** | CRUD | `productos`, `categoria`, `subcategoria` | Producto, Categoria, Subcategoria |
| **inventario** | **núcleo** | `kardex` + toda escritura de `Producto.stock` | Kardex (+ columna `stock` de Producto) |
| **ventas** | **núcleo** | `pedido`, `metodoenvio` | Pedido, DetallePedido, MetodoEnvio |
| **pagos** | **núcleo** | `payments.mp`, `payments.webhook`, `metodopago`, `pagarpedio` | MetodoPago (+ `estadoPago` de Pedido) |
| **tiendas** | CRUD | `tienda` | Tienda |
| **configuracion** | CRUD | `masterTable`, `estado` | MasterTable, Estado |
| **reportes** | lectura | `dashboard` | — (consultas SQL agregadas) |

Pendientes de decidir: `Empleado` y `Reporte` no tienen uso. Se resuelven en `contexto-identidad` y `limpieza-final`.

**Relaciones entre contextos:**

```
identidad ──(core/auth: authenticate/authorize)──▶ todos
ventas ──lee precios (puerto PreciosCatalogo)──▶ catalogo
ventas ──comisión del método de pago (puerto ComisionesPago)──▶ pagos
ventas ──reservar/liberar stock (misma transacción)──▶ inventario
ventas ──dirección de envío──▶ clientes
pagos ──confirmarPago / rechazarPago──▶ ventas
reportes ──consultas de solo lectura──▶ ventas, catalogo, inventario
```

**Dueño de cada dato:** la columna `Producto.stock` la escribe **solo** `inventario`. `catalogo` la lee. `Pedido.estadoPago` lo cambia **solo** `pagos`, a través de `ventas`.

---

## 4. Arquitectura objetivo

### 4.1 Backend (`TiendasMassBack-main/src/`)

```
src/
├── core/                         # kernel transversal, sin negocio (alias @core/*)
│   ├── config/env.ts             # variables de entorno validadas con Zod; falla al arrancar si falta algo
│   ├── database/
│   │   ├── data-source.ts        # synchronize: false
│   │   └── migrations/
│   ├── auth/
│   │   ├── tokens.ts             # firmar/verificar access token y challenge de OTP (RS256)
│   │   ├── authenticate.ts       # Bearer → req.user tipado
│   │   └── authorize.ts          # authorize([modulo, accion], …), requireSelfOr, requireSuperAdmin
│   ├── http/
│   │   ├── errorHandler.ts       # forma única { message, code, details? }
│   │   ├── validate.ts           # Zod sobre body/query/params
│   │   └── asyncHandler.ts
│   ├── errors/                   # AppError, DomainError, NotFoundError, ForbiddenError…
│   ├── logger.ts                 # pino
│   └── types/express.d.ts        # declara req.user
├── modules/                      # alias @modules/*
│   ├── identidad/  clientes/  catalogo/  inventario/  ventas/
│   └── pagos/  tiendas/  configuracion/  reportes/
├── app.ts                        # createApp(): middlewares + routers de módulos (sin listen)
└── server.ts                     # env → DataSource.initialize → createApp → listen
```

**Módulo núcleo** (ejemplo: `ventas`):

```
modules/ventas/
├── domain/
│   ├── Pedido.ts                 # agregado: líneas, totales, transiciones de estado
│   ├── LineaPedido.ts
│   ├── Dinero.ts                 # value object (céntimos enteros, PEN)
│   ├── EstadoPedido.ts           # máquina de estados
│   ├── PoliticaImpuestos.ts
│   ├── errores.ts
│   ├── PedidoRepository.ts       # puerto (interfaz) — el único repositorio con interfaz del contexto
│   └── puertos.ts                # PreciosCatalogo, ComisionesPago: lo que ventas necesita de otros contextos
├── application/
│   ├── CrearPedido.ts            # transacción: precios de catálogo + reserva de stock + persistir
│   ├── CancelarPedido.ts
│   ├── ConfirmarPagoPedido.ts    # lo invoca pagos
│   └── dtos.ts
├── infrastructure/
│   ├── adaptadoresLegacy.ts      # implementan los puertos leyendo Producto/MetodoPago hasta que catalogo y pagos migren
│   ├── PedidoEntity.ts           # TypeORM, @Entity("Pedido"): misma tabla de hoy
│   ├── DetallePedidoEntity.ts
│   ├── TypeOrmPedidoRepository.ts
│   └── pedidoMapper.ts
├── http/
│   ├── pedidos.routes.ts
│   ├── pedidos.controller.ts     # delgado: parsea → caso de uso → responde
│   └── pedidos.schemas.ts        # Zod
├── index.ts                      # buildVentas({ dataSource, inventario, precios, comisiones }) → { router, api }
└── __tests__/                    # unitarios de dominio + integración HTTP
```

**Módulo CRUD** (ejemplo: `catalogo`):

```
modules/catalogo/
├── productos/       productos.routes.ts · productos.controller.ts · productos.service.ts · productos.schemas.ts · producto.entity.ts
├── categorias/      …
├── subcategorias/   …
├── index.ts         buildCatalogo({ dataSource }) → { router, api: { obtenerPrecios(ids) } }
└── __tests__/
```

**Reglas de dependencias:**

- `domain/` no importa Express, TypeORM ni nada de `infrastructure/`.
- `application/` depende de `domain/` y de los puertos. Abre la transacción con un `UnitOfWork` mínimo que viene de `core/database`.
- Un módulo usa otro **solo** a través de la `api` que exporta su `index.ts`. Nunca importa sus archivos internos.
- Los controllers no tocan `DataSource`. Los services de CRUD reciben su `Repository<T>` por parámetro.
- `server.ts` es el único composition root: construye cada módulo con `build<Modulo>(deps)` y le pasa los routers a `createApp`.

### 4.2 Frontend (`TiendasMassFront-main/src/`)

```
src/
├── app/
│   ├── router.tsx               # rutas con React.lazy; guards por módulo/permiso
│   ├── providers.tsx            # sesión, carrito
│   └── layouts/                 # PublicLayout, AdminLayout
├── shared/
│   ├── api/client.ts            # ÚNICO cliente axios: baseURL = VITE_API_URL + '/api', token, 401 → logout
│   ├── api/assets.ts            # assetUrl() para imágenes de /uploads
│   ├── auth/session.ts          # ÚNICA sesión (token + usuario): login / logout / suscripción
│   ├── ui/                      # Button, Input, Card, Pagination, DataTable, CrudPage, Modal
│   └── lib/                     # validators (fuente única), formatters, escapeHtml
├── features/
│   ├── auth/  catalogo/  carrito/  checkout/  perfil/  tiendas/  legal/
│   └── admin/
│       ├── menu.ts              # fuente única módulo → ruta → permiso (hoy está en 3 lugares)
│       ├── productos/           # api.ts · useProductosAdmin.ts · ProductosPage.tsx · ProductoForm.tsx
│       └── categorias/  subcategorias/  usuarios/  pedidos/  kardex/  …
└── main.tsx
```

---

## 5. Decisiones de arquitectura (ADRs)

| # | Decisión | Elegida | Alternativa descartada | Por qué |
|---|---|---|---|---|
| ADR-01 | Forma del sistema | Monolito modular por bounded context | Microservicios / capas globales | Equipo y tráfico chicos; los contextos dan límites claros sin costo operativo |
| ADR-02 | Alcance de DDD | Solo `ventas`, `inventario`, `pagos` | DDD en todo / nada | Son los únicos con invariantes (totales, stock, estados de pago). En CRUD, DDD solo agrega ceremonia |
| ADR-03 | Inyección de dependencias | Composición manual: `build<Modulo>(deps)` en cada `index.ts`. **Se retira tsyringe** (instalado en la Fase 0, con 0 registros) | tsyringe con decoradores y tokens string | Sin magia ni `reflect-metadata` en el dominio; testeable pasando fakes. Reversible si un día hace falta |
| ADR-04 | Repositorios | Puerto (interfaz) solo por **agregado** en contextos núcleo. CRUD usa `Repository<T>` de TypeORM | Interfaz+impl por entidad (v1) | `Repository<T>` ya es un repositorio. Un puerto solo vale cuando hay dominio que proteger |
| ADR-05 | Modelo de dominio | En contextos núcleo: clases puras + entidad TypeORM + mapper. En CRUD la entidad TypeORM es el modelo | Entidades TypeORM como dominio en todas partes | El dominio rico se testea sin DB; el costo del mapper solo se paga donde hay reglas |
| ADR-06 | Esquema de base de datos | Migraciones TypeORM, `synchronize: false` | Mantener `synchronize: true` | Con `synchronize`, renombrar una columna en producción borra los datos. Es requisito para mover entidades |
| ADR-07 | Autenticación | Un solo flujo: `POST /api/auth/login` (password) → challenge firmado → `POST /api/auth/otp/verificar` → access token RS256 `{ sub, rol }`. Llaves por variables de entorno | Dos logins con payloads distintos (hoy) | Hoy el password se valida solo en el cliente y `cliente.controller` lee `payload.id` mientras `requirePermiso` lee `payload.userId` |
| ADR-08 | Autorización | `authorize([modulo, accion], …)` contra `Permiso`. Superadmin por columna `Rol.esSuperAdmin`. Asignar roles superadmin o editar los permisos de un rol superadmin o del propio rol: solo un superadmin | `rol.nombre.includes('admin')` (hoy) | Un rol llamado "Administrativo" hoy pasa como admin; el nombre es un texto editable. Sin la regla de superadmin, quien gestiona roles podría darse todos los permisos |
| ADR-09 | Errores HTTP | Forma única `{ message, code, details? }` | `{error}` / `{message}` / `{status,message}` (hoy) | Mantiene `message`, que el front ya lee en todos lados (`data.message \|\| data.error`) |
| ADR-10 | Front: organización | Por features + un cliente HTTP + una sesión | Por tipo (`api/`, `hooks/`, `components/`) como en v1 | Una feature se lee, se prueba y se borra entera; por tipo, cada cambio toca 4 carpetas |
| ADR-11 | Front: TypeScript | Incremental: `allowJs`; archivos nuevos en `.ts/.tsx`; los existentes migran cuando se tocan | Big-bang / seguir en JS | Tipa los contratos de API sin frenar el resto |
| ADR-12 | Tests backend | vitest + supertest contra MySQL real (`tiendasmass_test`); unitarios puros para el dominio | Mocks de TypeORM | Los mocks de ORM prueban el mock. La DB real en Docker cuesta poco |
| ADR-13 | Idioma de nombres | Capas técnicas en inglés (`domain/`, `application/`…); conceptos de negocio en español | Todo en un idioma | Las capas se reconocen por convención; el dominio habla el idioma del negocio |
| ADR-14 | OTP para admins | El admin también pasa por OTP (mismo flujo que los clientes) | `/api/auth/admin/login` sin OTP (hoy) | Es la cuenta con más privilegios. **Reversible**: si el negocio no lo quiere, `adminLogin` emite el token directo |
| ADR-15 | Montos | Totales y precios **siempre** se calculan en el servidor; la preferencia de MercadoPago se arma desde el pedido guardado | Confiar en `unit_price` / `montoTotal` del cliente (hoy) | Hoy un cliente puede pagar S/ 0.01 por cualquier pedido |

---

## 6. Plan de changes

Orden por olas. Dentro de una ola, los changes sin dependencia entre sí pueden ir en paralelo.

| # | Change | Ola | Alcance | ¿Cambia comportamiento observable? | Depende de | Artefactos |
|---|---|---|---|---|---|---|
| 1 | [`estabilizar-base`](openspec/changes/estabilizar-base/) | 0 · Base | back + front + CI | Solo corrige bugs (build, caída del servidor por Zod) y borra código muerto | — | proposal · specs · design · tasks |
| 2 | [`sesion-y-cliente-http`](openspec/changes/sesion-y-cliente-http/) | 0 · Base | front | Mínimo: sesión única (desaparece `adminToken`); todas las requests llevan el token | 1 | proposal · specs · design · tasks |
| 3 | [`hardening-seguridad`](openspec/changes/hardening-seguridad/) | 0 · Base | back + front | **Sí, a propósito**: auth en rutas, login unificado, pagos desde el servidor, endpoints inseguros eliminados | 1, 2 | proposal · specs · design · tasks |
| 4 | [`migraciones-bd`](openspec/changes/migraciones-bd/) | 1 · Cimientos | back | No | 1 | proposal |
| 5 | [`core-backend`](openspec/changes/core-backend/) | 1 · Cimientos | back | Forma de error unificada (compatible en `message`) | 3, 4 | proposal |
| 6 | [`frontend-base-features`](openspec/changes/frontend-base-features/) | 1 · Cimientos | front | No (lazy loading, reorganización) | 2 | proposal |
| 7 | [`contexto-inventario`](openspec/changes/contexto-inventario/) | 2 · Núcleo | back + front | Sí: el stock solo cambia por movimientos; el ajuste se vuelve explícito | 4, 5 | proposal |
| 8 | [`contexto-ventas`](openspec/changes/contexto-ventas/) | 2 · Núcleo | back + front | Sí: pedido transaccional con kardex; impuesto configurable | 7 | proposal |
| 9 | [`contexto-pagos`](openspec/changes/contexto-pagos/) | 2 · Núcleo | back + front | Sí: se elimina el formulario de tarjeta simulado; pagos idempotentes | 8 | proposal |
| 10 | [`contexto-identidad`](openspec/changes/contexto-identidad/) | 3 · Soporte | back + front | Sí: el estado del usuario pasa a ser un enum (no el nombre de una fila) | 5 | proposal |
| 11 | [`contexto-clientes`](openspec/changes/contexto-clientes/) | 3 · Soporte | back + front | Sí: los datos de dirección de `Usuario` se migran a `Direccion` | 10 | proposal |
| 12 | [`contextos-crud`](openspec/changes/contextos-crud/) | 3 · Soporte | back + front | Paginación del lado del servidor en el admin | 5, 6, 7 | proposal |
| 13 | [`limpieza-final`](openspec/changes/limpieza-final/) | 4 · Cierre | back + front | No | todos | proposal |

Los changes 1 a 3 están especificados por completo, listos para `apply`. Del 4 al 13 solo tienen `proposal.md`: su spec, design y tasks se escriben cuando les toque, con una exploración fresca del código. Así no se planifica en detalle sobre un código que los changes anteriores van a cambiar.

---

## 7. Cómo se trabaja un change

Flujo SDD: **explore → proposal → spec → design → tasks → apply → verify → archive.**

1. **Rama:** `estabilizar-base` se aplica sobre `refactor/clean-arch`, que después se fusiona a `main` (esa rama ya trae features: kardex y paginación). Desde el change 2, cada change va en su propia rama `change/<nombre>` desde `main`. Los PRs de cada *work unit* de `tasks.md` van **contra esa rama**, y la rama entra a `main` con un único merge.
   - `main` despliega en cada push (CI.4). Por eso solo entran a `main` antes los work units que su `tasks.md` marca como desplegables por separado (por ejemplo, WU1 de `hardening-seguridad`).
2. **Estado:** `openspec/changes/<nombre>/state.yaml` registra la fase y las notas. Las decisiones no obvias también se guardan en engram con el topic `sdd/<nombre>/<fase>`.
3. **Apply:** TDD. Cada tarea `TEST` cita IDs de escenario del spec (p. ej. `AUTH.3`) y va antes de su `IMPL`.
4. **Verify:** backend `npx tsc --noEmit && npm test`; frontend `npm test && npm run build`. Además, probar a mano los flujos que el spec nombra.
5. **Archive:** los delta specs se fusionan en `openspec/specs/<capacidad>/spec.md`, el change se mueve a `openspec/changes/archive/<fecha>-<nombre>/` y se actualiza la [tabla de progreso](#9-progreso).

---

## 8. Qué no hacer

- ❌ Agregar código nuevo en `controllers/`, `services/`, `routes/` o `middlewares/` legacy del backend.
- ❌ Usar `fetch()` o `axios` directo, o escribir URLs a mano, en el frontend. Todo pasa por `shared/api/client`.
- ❌ Crear interfaz + implementación de repositorio para un CRUD.
- ❌ Modificar una entidad sin migración (desde `migraciones-bd`).
- ❌ Cambiar comportamiento observable que el spec del change no declare.
- ❌ Confiar en identificadores de usuario, precios o montos que vengan del cliente. Salen del token y de la DB.
- ❌ Migrar de ORM, de build system (Vite), de sistema de estilos (Tailwind) o a otro state manager (Context alcanza). Siguen fuera de alcance.

---

## 9. Progreso

| # | Change | Estado | Inicio | Fin |
|---|---|---|---|---|
| — | Plan v1 · Fase 0 (alias, `AppError`, tsyringe) | ✅ Hecho (tsyringe se retira según ADR-03) | 2026-06-09 | 2026-06-09 |
| 1 | estabilizar-base | 📝 Listo para apply | — | — |
| 2 | sesion-y-cliente-http | 📝 Listo para apply | — | — |
| 3 | hardening-seguridad | 📝 Listo para apply | — | — |
| 4 | migraciones-bd | 💡 Propuesta | — | — |
| 5 | core-backend | 💡 Propuesta | — | — |
| 6 | frontend-base-features | 💡 Propuesta | — | — |
| 7 | contexto-inventario | 💡 Propuesta | — | — |
| 8 | contexto-ventas | 💡 Propuesta | — | — |
| 9 | contexto-pagos | 💡 Propuesta | — | — |
| 10 | contexto-identidad | 💡 Propuesta | — | — |
| 11 | contexto-clientes | 💡 Propuesta | — | — |
| 12 | contextos-crud | 💡 Propuesta | — | — |
| 13 | limpieza-final | 💡 Propuesta | — | — |

---

## Apéndice A — Diagnóstico (2026-10-11)

Auditoría de solo lectura sobre la rama `refactor/clean-arch`. Las rutas son relativas a cada app.

### A.1 Build, CI y configuración

- `npx tsc --noEmit` falla: `src/services/kardex.service.ts:98` (TS2769, `usuario: Usuario | null`). `npm run dev` no lo detecta porque corre con `--transpile-only`.
- **Una petición inválida tumba el servidor:** `src/middlewares/validate.ts:18` usa `zodError.errors`, que en Zod 4.4 es `undefined`. El `TypeError` escapa del middleware `async` y Express 4 no lo captura (rechazo de promesa no manejado). Se dispara con cualquier body inválido en `POST/PUT /api/products`.
- `.github/workflows/` está dentro de `TiendasMassBack-main/` y `TiendasMassFront-main/`. GitHub Actions solo lee el `.github/` de la raíz, así que el deploy a Azure no corre.
- Las llaves JWT se leen de `src/keys/*.key`, que está en `.gitignore`. Un build en CI no las tendría y el servidor caería al arrancar (`verificarToken.ts:6`).
- `data-source.ts:16` tiene `synchronize: true`, con credenciales de respaldo `root/root`.
- CORS hardcodeado en `app.ts:41-48`; el origen ngrok tiene un espacio al final y nunca coincide.

### A.2 Seguridad (backend)

- **Escalada de privilegios:** `POST /api/usuarios/register` toma `rolId` y `estadoId` del body (`usuarios.controller.ts:80-84`). Además, su valor por defecto `rolId = 2` es **Almacenero** en una base creada con `npm run seed` (`seed.ts:55-60`).
- **Fuga de hashes:** `GET /api/usuarios` es público (`usuarios.routes.ts:9`) y serializa la entidad completa, password incluido (`usuarios.controller.ts:30-36`).
- **El password se valida solo en el cliente:** el front llama a `/api/usuarios/login` y después a `/api/auth/otp/solicitar`, pero `solicitar` solo pide el email. Además `codigoDev` vuelve en la respuesta siempre que `NODE_ENV !== 'production'` (`auth.controller.ts:228-235`), y ni `.env.example` ni el workflow definen `NODE_ENV`.
- **Dos payloads de JWT:** `/api/auth/*` firma `{userId}` y `/api/usuarios/login` firma `{id}` sin OTP. `cliente.controller.ts:18,119` lee `payload.id`, así que `/api/clientes/me` falla con los tokens que el front guarda. `requirePermiso` lee `payload.userId`.
- `adminAuth.middleware.ts:17` verifica HS256 con el respaldo `'tu_secreto_jwt'`, mientras los tokens son RS256: las mutaciones de `/api/roles` quedan rotas o se pueden falsificar.
- **Sin auth:** las mutaciones de productos, categorías, subcategorías, estados, tiendas, métodos de pago y envío, master-table y kardex. También todo `/api/pedidos` (incluido listar todos), `/api/dashboard` y las direcciones y tarjetas de cualquier usuario por id.
- **Pagos:** `PATCH /api/pedidos/:id/estado-pago` y `POST /api/pedidos/pagar` son públicos y marcan un pedido como pagado. `POST /api/payments/mp/preference` toma `unit_price` del cliente (`payments.mp.ts:49-55`). Con un `preference_id`, `/confirm` devuelve el último pedido COMPLETADO de cualquier usuario (`payments.mp.ts:205-217`). El webhook no compara el monto pagado con el del pedido.
- `crearPedido` toma `usuarioId` del body.
- Superadmin = `rol.nombre.includes('admin')` (`requirePermiso.ts:23`); usuario activo = `estado.nombre === 'activo'` (`auth.controller.ts:34`).
- OTP generado con `Math.random()` (`otp.service.ts:19`).

### A.3 Diseño (backend)

- `crearPedido` descuenta stock sin transacción, sin bloqueo y sin escribir en el kardex (`pedido.service.ts:94-117`): puede sobrevender y el kardex no coincide con el stock real. Impuesto del 8% fijo en el código (`pedido.service.ts:74`); en Perú el IGV es 18%, falta confirmar si es intencional.
- Un solo `Estado` genérico sirve a Usuario, Producto, Categoría y Subcategoría, mientras Pedido usa enums. `Usuario` repite datos de `Persona` y de `Direccion`.
- El dashboard trae todos los pedidos a memoria y suma en JS (`dashboard.controller.ts:21-46`).
- `AdminModulo` no tiene `KARDEX` ni `ROLES`, aunque el front muestra esos módulos.
- Uploads: multer escribe en `<cwd>/src/public/uploads/productos` (`upload.ts:7`), pero el servidor sirve `path.join(__dirname, 'public/uploads')` (`app.ts:56`). En producción `__dirname` es `dist/`, así que las imágenes subidas después del deploy no se sirven. Además, un nuevo deploy por zip reemplaza `wwwroot` y borra las subidas.
- Código muerto: `services/subcategoria.service.ts`, `controllers/roles.controller.ts`, `routes/tarjeta.routes.ts` + `controllers/tarjeta.controller.ts` + `services/tarjeta.service.ts` (nunca montados), `app.ts:80-81` (monta `tarjetas-usuario` dos veces), y las dependencias `bcrypt` y `node` sin uso.

### A.4 Frontend

- 5 convenciones HTTP. `services/api/axios.instance.js` tiene la URL hardcodeada y nadie lo importa. Solo 3 archivos usan `VITE_API_URL`.
- Sesión doble (`token` en local o session vs `adminToken`). `useCheckoutForm.js:248` manda `usuario?.token`, que no existe, así que el pedido sale sin Authorization. El logout del admin no quita el acceso (`Sidebar.jsx:67-68`). `AdminRoute` solo exige "tener algún módulo".
- **XSS almacenado:** `ReportesPedidos.jsx:156-215` arma HTML con `document.write` usando datos del cliente sin escapar.
- **Bugs:** `perfil/metodopago.jsx:148` usa `numeroLimpio`, que no está definido; `/producto/:id` siempre sale en blanco (`App.jsx:68`); el ícono de WhatsApp apunta a una ruta de Windows.
- `GestionCategorias` y `GestionSubcategorias` son copias en un 80%. Email validado con 5 regex distintas. `AdminTable` se usa en 7 de 13 pantallas.
- ~2.083 líneas muertas (23 archivos). 62 errores de ESLint. Sin lazy loading. 3.599 líneas de CSS en paralelo a Tailwind. Un solo archivo de tests (47 tests que pasan) sin bloque `test` en `vite.config.js`. `test-results/` commiteado.

### A.5 Agentes del plan v1

`.claude/agents/{repository-architect,service-migrator,di-wiring,api-unifier,component-splitter,cleanup-engineer}.md` y `.agents/skills/` implementan las fases horizontales del v1 y **contradicen este plan** (por ejemplo, repositorio interfaz+impl por entidad, o tsyringe). No hay que usarlos. Se archivan o se reescriben como parte de `limpieza-final`, o antes si alguien lo pide.
