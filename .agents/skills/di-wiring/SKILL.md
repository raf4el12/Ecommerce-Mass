---
name: di-wiring
description: Specialized agent for Phase 3 of the Clean Architecture migration. Wires all repositories, services, and controllers into the tsyringe DI container. Removes all direct instantiation (`new XxxService()`, `AppDataSource.getRepository()`) from controllers and routes. Depends on Phase 2 (services + validators) being complete.
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  orchestrator: solid-clean-arch-migration
  phase: 3
---

# DI Wiring (Phase 3)

**Scope:** Backend only (`TiendasMassBack-main/src/`).
**Goal:** Connect all layers through tsyringe DI container. Eliminate all static instantiations.
**Contract:** Modifies `src/core/container.ts`, `src/app.ts`, and route registration. Does NOT touch business logic.

## Input

From orchestrator:
- Phase 2 complete (all modules have `service`, `controller`, `validator`, `routes` with `@injectable()`/`@inject()` decorators)
- All old controllers deleted from `src/controllers/`
- Route files exist in `src/modules/<name>/<name>.routes.ts`

## Steps

### Step 1: Update `src/core/container.ts`

Register ALL repositories, services, and controllers in the container:

```typescript
// src/core/container.ts
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';
import { AppDataSource } from '@config/data-source';

// ── Repositories ───────────────────────────────────────
// Register DataSource as a value
container.registerInstance<DataSource>(DataSource, AppDataSource);

// Register each repository by interface token
import { ICategoriaRepository, TypeOrmCategoriaRepository } from '@modules/categoria/categoria.repository';
container.registerSingleton<ICategoriaRepository>('ICategoriaRepository', TypeOrmCategoriaRepository);

import { IProductoRepository, TypeOrmProductoRepository } from '@modules/producto/producto.repository';
container.registerSingleton<IProductoRepository>('IProductoRepository', TypeOrmProductoRepository);

// ... repeat for all modules

// ── Services ───────────────────────────────────────────
import { CategoriaService } from '@modules/categoria/categoria.service';
container.registerSingleton<CategoriaService>('ICategoriaService', CategoriaService);

// ... repeat for all modules

// ── Controllers ────────────────────────────────────────
import { CategoriaController } from '@modules/categoria/categoria.controller';
container.registerSingleton<CategoriaController>('CategoriaController', CategoriaController);

// ... repeat for all modules

export { container };
```

**Important:** tsyringe uses `reflect-metadata` for decorator reflection. Ensure `import 'reflect-metadata'` is the first import in `container.ts`.

### Step 2: Update `src/app.ts`

Replace all direct instantiations with container resolution:

```typescript
// Before (from Phase 2 temporary wiring):
import { createCategoriaRoutes } from '@modules/categoria/categoria.routes';
import { CategoriaController } from '@modules/categoria/categoria.controller';
import { TypeOrmCategoriaRepository } from '@modules/categoria/categoria.repository';
const categoriaRoutes = createCategoriaRoutes(
  new CategoriaController(new CategoriaService(new TypeOrmCategoriaRepository(dataSource)))
);

// After (DI resolution):
import { container } from '@core/container';
import { createCategoriaRoutes } from '@modules/categoria/categoria.routes';

const categoriaRoutes = createCategoriaRoutes(
  container.resolve(CategoriaController)
);
```

### Step 3: Register all routes via a single setup function

Option A (recommended): Create a `registerRoutes` function in `container.ts` or a separate `src/core/routes.ts`:

```typescript
// src/core/routes.ts
import { Router } from 'express';
import { container } from './container';
import { createCategoriaRoutes } from '@modules/categoria/categoria.routes';
import { createProductoRoutes } from '@modules/producto/producto.routes';
// ... imports for all route creators

export function registerAllRoutes(): Router {
  const api = Router();

  api.use('/categorias', createCategoriaRoutes(container.resolve(CategoriaController)));
  api.use('/productos', createProductoRoutes(container.resolve(ProductoController)));
  // ... all other routes

  return api;
}
```

Then in `app.ts`:
```typescript
import { registerAllRoutes } from '@core/routes';
app.use('/api', registerAllRoutes());
```

### Step 4: Verify no direct instantiations remain

```bash
# Search for remaining anti-patterns in src/modules/ and src/app.ts
grep -rn "new.*Controller(" src/modules/ src/app.ts || echo "✅ No direct controller instantiations"
grep -rn "getRepository(" src/modules/ src/app.ts || echo "✅ No direct getRepository calls"
grep -rn "new.*Service(" src/modules/ src/app.ts || echo "✅ No direct service instantiations"
```

Exception: Repository classes receive `DataSource` via constructor — but they should never be instantiated manually. The DI container handles it.

## What NOT to do

- ❌ Do NOT change service or controller business logic
- ❌ Do NOT change route paths, HTTP methods, or middleware order
- ❌ Do NOT remove `@injectable()` or `@inject()` decorators
- ❌ Do NOT add new dependencies to modules (except container registration)
- ❌ Do NOT modify entity files

## Validation

After wiring all modules:

1. `npm run dev` — server must compile and start WITHOUT errors
2. Hit ALL key endpoints:
   ```bash
   for ep in categorias productos subcategorias pedidos usuarios estados tiendas; do
     echo "--- /api/$ep ---"
     curl -s "http://localhost:5001/api/$ep" | head -2
   done
   ```
3. Test error cases: 404 for non-existent IDs, 400 for invalid input
4. Verify no "cannot read property" or "not a constructor" TypeScript/DI errors

## Troubleshooting DI Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `registerToken is not a function` | Missing `reflect-metadata` | Add `import 'reflect-metadata'` as first line in container.ts |
| `Cannot inject the value at position 0` | Missing `@injectable()` decorator | Add `@injectable()` to the class |
| `No matching bindings found` | Token not registered | Register the dependency in container.ts |
| `Cyclic dependency` | Circular import between modules | Extract shared types to `@core/types/` |

## Completion Checklist

- [ ] All repositories registered in container by interface token
- [ ] All services registered in container
- [ ] All controllers registered in container
- [ ] `container.ts` has `DataSource` instance registered
- [ ] `app.ts` uses `container.resolve()` for all controllers
- [ ] No `new XxxService()` or `new XxxController()` in src/app.ts or src/modules/
- [ ] No `AppDataSource.getRepository()` outside of repository classes
- [ ] Server compiles and runs
- [ ] All endpoints return identical responses to baseline
