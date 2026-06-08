# SOLID + Clean Architecture Migration Roadmap

> **Proyecto:** TiendasMass — E-commerce Admin Platform
> **Objetivo:** Migrar la base de código actual a una arquitectura limpia respetando principios SOLID, **sin cambiar el comportamiento funcional**.
> **Estrategia:** Refactor incremental por fases, 100% backward compatible. Cada fase es desplegable de forma independiente.

---

## Tabla de Contenido

- [Estado Actual vs Objetivo](#estado-actual-vs-objetivo)
- [Estructura Target](#estructura-target)
- [Fases del Refactor](#fases-del-refactor)
- [Especificaciones Técnicas](#especificaciones-técnicas)
- [Notas para Agentes Autónomos](#notas-para-agentes-autónomos)
- [Glosario de Decisiones](#glosario-de-decisiones)

---

## Estado Actual vs Objetivo

| Aspecto | Actual | Target |
|---------|--------|--------|
| **Controladores** | 24 archivos, lógica de negocio + DB + HTTP mezclados | Solo HTTP: parse request → call service → send response |
| **Servicios** | Solo 3 (Producto, Pedido, Tarjeta, OTP) | Todos los módulos tienen servicio con lógica de negocio |
| **Repositorios** | No existen. DB access via `AppDataSource.getRepository()` inline | Capa de repositorios con interfaces e inyección |
| **Validación** | Solo Zod en productos. Manual en el resto | Zod en todas las rutas (schemas compartidos) |
| **DI** | Ninguno. `new XxxService()`, `AppDataSource.getRepository()` | Contenedor DI (tsyringe). Inyección por constructor |
| **API Client (Frontend)** | `fetch()` hardcodeado en 10+ archivos + 1 Axios instance | Axios instance unificada con env vars |
| **Admin Components** | Self-contained (fetch + state + UI todo junto) | Separación container/presentational con hooks de datos |
| **Tests** | Backend: 0. Frontend: 1 archivo (checkout validations) | Tests unitarios backend + tests de componentes frontend |
| **Duplicación** | `rol` y `roles` controllers. Auth en 2 controllers | Sin duplicación |
| **URLs hardcodeadas** | `http://localhost:5001` en 10+ archivos | `VITE_API_URL` en `.env` |

---

## Estructura Target

### Backend (`TiendasMassBack-main/src`)

```
src/
├── core/                          # Cross-cutting concerns
│   ├── container.ts               # DI container setup (tsyringe)
│   ├── errors/
│   │   └── AppError.ts            # Clase base de errores
│   ├── middleware/
│   │   ├── errorHandler.ts        # Global error handler
│   │   ├── auth.middleware.ts     # JWT verification
│   │   ├── requireAdmin.ts       # Admin guard
│   │   ├── requirePermiso.ts     # Permission guard
│   │   ├── upload.ts             # Multer
│   │   └── validate.ts           # Zod validation middleware
│   └── types/
│       ├── express.d.ts          # Express type augmentations
│       └── enums.ts              # Enums compartidos
│
├── modules/                        # Feature modules
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.validator.ts
│   ├── categoria/
│   │   ├── categoria.controller.ts
│   │   ├── categoria.service.ts
│   │   ├── categoria.repository.ts (interface + impl)
│   │   ├── categoria.routes.ts
│   │   ├── categoria.validator.ts
│   │   └── dtos/
│   │       └── CreateCategoria.dto.ts
│   ├── producto/                  # Misma estructura
│   ├── pedido/
│   ├── subcategoria/
│   ├── usuario/
│   ├── cliente/
│   ├── direccion/
│   ├── tienda/
│   ├── dashboard/
│   ├── estado/
│   ├── metodo-pago/
│   ├── metodo-envio/
│   ├── tarjeta/
│   ├── rol/
│   ├── permiso/
│   ├── master-table/
│   ├── tipo-cliente/
│   └── setup/
│
├── entities/                      # TypeORM entities (se quedan igual)
│   └── *.entity.ts
│
├── config/
│   ├── data-source.ts
│   └── mercadopago.ts
│
├── scripts/
│   └── seed.ts
│
└── app.ts                         # Entry point (register routes from modules)
```

### Frontend (`TiendasMassFront-main/src`)

```
src/
├── api/                           # API client layer
│   ├── client.ts                  # Axios instance (único)
│   └── modules/
│       ├── productos.api.ts
│       ├── categorias.api.ts
│       ├── pedidos.api.ts
│       └── ...
│
├── hooks/                         # Custom hooks (data layer)
│   ├── useProductos.ts
│   ├── useCategorias.ts
│   └── ...
│
├── context/                       # Global state (se mantiene)
│   ├── carContext.tsx
│   └── userContext.tsx
│
├── components/                    # UI components (presentational)
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── layout/
│   ├── productos/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ProductDetailModal.tsx
│   └── ...
│
├── pages/                         # Page components (containers)
│   ├── Catalogo.tsx
│   ├── Home.tsx
│   └── ...
│
├── admin/
│   ├── components/                # Solo UI, sin fetch
│   │   ├── GestionProducto.tsx
│   │   └── ...
│   ├── hooks/                     # Data fetching para admin
│   │   ├── useAdminProductos.ts
│   │   └── ...
│   └── menuConfig.ts
│
├── utils/
│   ├── validators/
│   └── formatters/
│
├── styles/
├── assets/
└── App.tsx
```

---

## Fases del Refactor

### Fase 0 — Preparación

**Objetivo:** Setup del proyecto sin tocar lógica existente.

**Tareas:**

- [ ] Crear branch `refactor/clean-arch` desde `main`
- [ ] Instalar dependencias backend: `tsyringe`, `reflect-metadata` (ya está)
- [ ] Agregar `experimentalDecorators: true`, `emitDecoratorMetadata: true` en tsconfig si no están
- [ ] Crear `src/core/container.ts` con contenedor vacío
- [ ] Crear `src/core/errors/AppError.ts` (unificar con ApiError existente)
- [ ] Crear estructura de carpetas `src/modules/`
- [ ] Configurar `tsconfig.json` paths para imports limpios (`@modules/*`, `@core/*`, `@entities/*`)
- [ ] Verificar que `npm run dev` y `npm run seed` sigan funcionando

**Archivos creados:** ~5
**Archivos modificados:** `tsconfig.json`, `package.json`
**Criterio de éxito:** `npm run dev` inicia sin errores.

---

### Fase 1 — Capa de Repositorios (DIP + SRP)

**Objetivo:** Extraer todo acceso a DB de los controllers hacia repositorios con interfaces.

**Tareas:**

Por cada entidad (Categoria, Producto, Subcategoria, Pedido, Usuario, Cliente, Direccion, etc.):

- [ ] Crear interfaz `I{Nombre}Repository` en `src/modules/{nombre}/`
- [ ] Implementar `TypeOrm{Nombre}Repository` inyectando DataSource
- [ ] Registrar en contenedor DI

**Reglas:**
- Un repositorio = una entidad (aggregate root)
- Los repositorios solo tienen métodos CRUD + queries específicas
- NO contienen lógica de negocio
- Retornan entidades TypeORM, no DTOs

**Archivos a crear:** ~20-25 (1 interfaz + 1 impl por módulo)
**Archivos a modificar:** Ninguno aún (los controllers siguen llamando directo a TypeORM)
**Criterio de éxito:** Los repositorios existen y se pueden testear de forma aislada.

---

### Fase 2 — Capa de Servicios + Controllers Livianos (SRP + OCP)

**Objetivo:** Mover lógica de negocio de controllers a servicios. Controllers quedan como thin handlers.

**Tareas:**

Por cada módulo:

1. **Crear servicio** extrayendo lógica de negocio del controller actual:
   - Validaciones de negocio (existencia, duplicados, stock, etc.)
   - Cálculos (precios, descuentos, estadísticas)
   - Transacciones
   - Llamadas a repositorios

2. **Refactorizar controller**:
   - Recibe servicio por inyección (constructor)
   - Solo parsea request, llama al servicio, envía response
   - Manejo de errores delegado al `errorHandler` global

3. **Agregar validación Zod** a todas las rutas:
   - Schemas de request body, query params, path params
   - Usar middleware `validate.ts` existente

**Orden sugerido (de menor a mayor riesgo):**
1. `tipo-cliente` (solo GET, simple)
2. `metodo-pago` / `metodo-envio` (CRUD simple)
3. `estado` (CRUD + reorder)
4. `tienda` (CRUD)
5. `categoria` (CRUD)
6. `subcategoria` (CRUD)
7. `direccion` (CRUD + setPrincipal)
8. `tarjeta` / `tarjeta-usuario`
9. `master-table`
10. `cliente`
11. `usuario` (complejo: register con transacción, login, JWT)
12. `auth` (unificar con login de usuarios)
13. `rol` / `permiso` (eliminar duplicado `roles.controller.ts`)
14. `producto` (ya tiene servicio — extender)
15. `pedido` (ya tiene servicio — extender)
16. `dashboard` (lógica de estadísticas)
17. `setup`
18. `pagar-pedido`

**Archivos a modificar:** ~50-60 (todos los controllers + rutas)
**Archivos a crear:** ~20 servicios + ~20 validators
**Criterio de éxito:** Todos los endpoints funcionan igual que antes (probar con curl o desde frontend).

---

### Fase 3 — Dependency Injection (DIP)

**Objetivo:** Conectar todo mediante DI. Eliminar instanciaciones estáticas.

**Tareas:**

- [ ] Registrar todos los repositorios en el contenedor con su interfaz
- [ ] Registrar todos los servicios en el contenedor
- [ ] Modificar controllers para recibir dependencias por constructor
- [ ] Modificar `app.ts` para resolver controllers desde el contenedor
- [ ] Eliminar imports directos de `AppDataSource.getRepository()` en toda la app

**Reglas:**
- Las rutas deben poder recibir el controller desde el contenedor
- No debe quedar ningún `new XxxService()` o `AppDataSource.getRepository()` fuera de repositorios
- Los repositorios reciben `DataSource` por constructor

**Archivos a modificar:** `app.ts`, todos los routes, todos los controllers
**Criterio de éxito:** La app arranca y todas las rutas responden sin errores de dependencia.

---

### Fase 4 — Frontend: API Client Unificado (OCP)

**Objetivo:** Unificar toda la comunicación HTTP en un solo cliente Axios.

**Tareas:**

- [ ] Mover `VITE_API_URL` a `.env` + `.env.example`
- [ ] Refactorizar `src/api/client.ts` (axios.instance.js):
  - Interceptor de token desde `userContext` o localStorage
  - Interceptor de errores (401 → logout, 500 → notificación)
  - Tipado genérico para respuestas
- [ ] Crear `src/api/modules/` con una función por endpoint:
  ```ts
  // api/modules/productos.api.ts
  export const getProducts = (params?: ProductFilters): Promise<Producto[]> =>
    client.get('/api/products', { params }).then(r => r.data);
  ```
- [ ] Migrar TODOS los `fetch()` hardcodeados a usar el Axios instance:
  - Admin components (GestionCategorias, GestionProducto, etc.)
  - Pages (Home, Catalogo, etc.)
  - Checkout (checkoutService.ts, paymentService.ts)
  - Hooks (useMasterTable, useOTPAuth, usePermitedModulos)
  - Perfil components

**Búsqueda para migrar:**
```bash
grep -r "localhost:5001" src/ --include="*.{jsx,tsx,js,ts}"
grep -r "fetch(" src/ --include="*.{jsx,tsx,js,ts}"
```

**Archivos a modificar:** ~20-25
**Criterio de éxito:** 0 ocurrencias de `localhost:5001` y 0 `fetch()` en el código (reemplazados por `client`).

---

### Fase 5 — Frontend: Separación de Concerns (SRP)

**Objetivo:** Separar lógica de datos de la presentación en admin y pages.

**Tareas:**

- [ ] Por cada admin component, extraer data fetching a un hook:
  ```tsx
  // admin/hooks/useAdminProductos.ts
  export function useAdminProductos() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      getProducts().then(setProductos).finally(() => setLoading(false));
    }, []);

    const create = async (data: CreateProductoDto) => { ... };
    const update = async (id: number, data: UpdateProductoDto) => { ... };
    const remove = async (id: number) => { ... };

    return { productos, loading, create, update, remove };
  }
  ```
- [ ] Refactorizar componente admin a presentational (recibe props, no hace fetch)
- [ ] Mover lógica de navegación/ruteo de admin components al hook o a `menuConfig.ts`
- [ ] Hacer lo mismo para pages públicas si aplica

**Orden sugerido (por complejidad):**
1. `GestionEstados` (CRUD simple)
2. `GestionMetodoPago`
3. `GestionTienda`
4. `GestionCategorias`
5. `GestionSubcategorias`
6. `GestionUsuarios`
7. `GestionPermisos`
8. `GestionProducto` (el más complejo, con upload de imagen)
9. `ReportesPedidos`
10. `Dashboard`

**Archivos a modificar:** ~30
**Criterio de éxito:** Cada admin component recibe datos por props. Los hooks de datos están aislados y testeables.

---

### Fase 6 — Limpieza y Tests

**Objetivo:** Eliminar duplicación, consolidar lógica y agregar tests.

**Tareas:**

- [ ] **Eliminar duplicados:**
  - Unificar `rol.controller.ts` y `roles.controller.ts`
  - Unificar lógica de auth (`auth.controller` + `usuarios.controller`)
  - Mover lógica de login JWT a auth service

- [ ] **Backend tests (vitest):**
  - Configurar vitest + tsx en backend
  - Test de integración: cada endpoint responde correctamente
  - Test de servicios con repositorios mockeados
  - Test de validators (Zod schemas)

- [ ] **Frontend tests:**
  - Test de hooks de datos (component-hooks pattern)
  - Test de componentes presentacionales con mocking de datos
  - Mantener y extender tests de checkout validations existentes

- [ ] **Consolidar validaciones:**
  - Mover validadores actuales de `src/utils/*validaciones.jsx` a schemas compartidos
  - Si es posible, generar Zod schemas del backend y reusar tipos en frontend

**Archivos a modificar:** ~10
**Archivos a crear:** ~10-15 test files
**Criterio de éxito:** `npm test` pasa en backend y frontend. Cobertura mínima del 40% en módulos core.

---

## Especificaciones Técnicas

### Dependency Injection — tsyringe

```ts
// container.ts
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';

// Repositories
container.registerSingleton<ICategoriaRepository>(
  'ICategoriaRepository',
  TypeOrmCategoriaRepository
);

// Services
container.registerSingleton<ICategoriaService>(
  'ICategoriaService',
  CategoriaService
);
```

```ts
// categoria.controller.ts
import { injectable, inject } from 'tsyringe';

@injectable()
export class CategoriaController {
  constructor(
    @inject('ICategoriaService') private service: ICategoriaService
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categorias = await this.service.getAll();
      res.json(categorias);
    } catch (err) {
      next(err);
    }
  };
}
```

### Repository Pattern

```ts
// modules/categoria/categoria.repository.ts
export interface ICategoriaRepository {
  findAll(): Promise<Categoria[]>;
  findById(id: number): Promise<Categoria | null>;
  findByNombre(nombre: string): Promise<Categoria | null>;
  create(data: Partial<Categoria>): Promise<Categoria>;
  update(id: number, data: Partial<Categoria>): Promise<Categoria>;
  delete(id: number): Promise<void>;
}

export class TypeOrmCategoriaRepository implements ICategoriaRepository {
  constructor(private dataSource: DataSource) {}

  private get repo() {
    return this.dataSource.getRepository(Categoria);
  }

  async findAll() { return this.repo.find({ relations: ['estado'] }); }
  async findById(id: number) { return this.repo.findOne({ where: { id } }); }
  // ...
}
```

### Validación con Zod

```ts
// modules/producto/producto.validator.ts
import { z } from 'zod';

export const createProductoSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).max(200),
    precio: z.number().positive(),
    stock: z.number().int().nonnegative(),
    marca: z.string().optional(),
    categoriaId: z.number().int().positive(),
    subcategoriaIds: z.array(z.number().int().positive()).optional(),
  }),
});

export const updateProductoSchema = createProductoSchema.partial();
```

### Frontend API Client

```ts
// api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
```

### Frontend Data Hook Pattern

```ts
// hooks/useProductos.ts
import { useState, useEffect } from 'react';
import { getProducts } from '../api/modules/productos.api';
import type { Producto, ProductFilters } from '../types';

export function useProductos(filters?: ProductFilters) {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    getProducts(filters)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { data, loading, error };
}
```

---

## Notas para Agentes Autónomos (Claude Code, etc.)

### Pre-requisitos antes de empezar cualquier fase

1. Leer este roadmap completo
2. Leer `SOLID_CLEAN_ARCH_ROADMAP.md` (este archivo)
3. Verificar branch actual: `git branch` (debe ser `refactor/clean-arch`)
4. Verificar que el proyecto compila y corre antes de hacer cambios:
   ```bash
   cd TiendasMassBack-main && npm run dev &
   cd TiendasMassFront-main && npm run dev &
   ```
5. Verificar que `docker ps` muestra `tiendasmass_db` corriendo

### Reglas durante la ejecución

1. **NO cambiar comportamiento funcional.** Si un endpoint devolvía `{ data: [...] }`, debe seguir devolviendo lo mismo. Si un componente se veía de cierta forma, debe verse igual.

2. **Un módulo por commit.** Ej: `refactor(categoria): add repository and service layer`

3. **No mover archivos de entidad.** Las entities de TypeORM se quedan en `src/entities/`. No se mueven a modules.

4. **No tocar `synchronize: true`** en `data-source.ts`. Eso se maneja aparte.

5. **Mantener las rutas HTTP exactas.** Si hoy es `GET /api/categorias`, después del refactor debe seguir siendo `GET /api/categorias`.

6. **Validar después de cada fase:**
   ```bash
   # Backend
   cd TiendasMassBack-main && npm run dev
   # Probar endpoints clave:
   curl http://localhost:5001/api/categorias
   curl http://localhost:5001/api/productos
   curl http://localhost:5001/api/subcategorias
   
   # Frontend
   cd TiendasMassFront-main && npm run dev
   # Abrir http://localhost:5173 y navegar
   ```

### Qué NO hacer

- ❌ No refactorizar entidades TypeORM ni sus relaciones
- ❌ No cambiar nombres de endpoints API
- ❌ No cambiar nombres de campos en respuestas JSON
- ❌ No migrar a otra base de datos
- ❌ No cambiar el sistema de estilos (Tailwind)
- ❌ No cambiar el sistema de build (Vite)
- ❌ No renombrar archivos que otras partes del sistema importan (hacerlo gradual)

### Señales de alerta

Si durante el refactor encuentras:
- Un endpoint que no puedes probar → **detente** y pregunta
- Una dependencia cíclica entre módulos → **detente** y rediseña
- Un archivo > 400 líneas que no es una entidad → **probablemente necesita split**
- `any` en TypeScript sin justificación → **mejor tipar**

---

## Glosario de Decisiones

| Decisión | Opción Elegida | Alternativa | Por qué |
|----------|---------------|-------------|---------|
| DI Container | tsyringe | inversify, awilix | Más liviano, decoradores simples, suficiente para este alcance |
| Validación | Zod | Joi, Yup | Ya está parcialmente en uso, buena integración con TypeScript |
| API Client | Axios (existente) | fetch nativo, ky | Ya tenemos Axios instance con interceptores, extender no reescribir |
| State Management | React Context (mantener) | Redux, Zustand | El alcance actual no justifica migrar. Context + localStorage es suficiente |
| Test Runner | Vitest (existente) | Jest | Ya configurado en frontend, extender a backend |
| Base de datos | MySQL + TypeORM (mantener) | Prisma, Drizzle | Migrar ORM está fuera del scope. TypeORM con repository pattern es suficiente |
| Monorepo | No (proyectos separados) | Turborepo, Nx | Los proyectos ya están separados, no hay beneficio inmediato en unificar |

---

## Progreso

| Fase | Estado | Iniciado | Completado |
|------|--------|----------|------------|
| 0 — Preparación | 🔲 Pendiente | — | — |
| 1 — Repositorios | 🔲 Pendiente | — | — |
| 2 — Servicios + Controllers | 🔲 Pendiente | — | — |
| 3 — Dependency Injection | 🔲 Pendiente | — | — |
| 4 — API Client Frontend | 🔲 Pendiente | — | — |
| 5 — Separación Frontend | 🔲 Pendiente | — | — |
| 6 — Limpieza + Tests | 🔲 Pendiente | — | — |

---

*Documento generado el 2026-06-08. Última actualización: Fase 0.*
