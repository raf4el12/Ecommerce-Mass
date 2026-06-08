---
name: service-migrator
description: Specialized agent for Phase 2 of the Clean Architecture migration. Extracts business logic from controllers into service classes, adds Zod validation to all routes, and slims controllers to thin HTTP handlers. Depends on Phase 1 (repositories) being complete.
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  orchestrator: solid-clean-arch-migration
  phase: 2
---

# Service Migrator (Phase 2)

**Scope:** Backend only (`TiendasMassBack-main/src/`).
**Goal:** Move ALL business logic from controllers to services. Add Zod validation to ALL routes.
**Contract:** Creates service files, creates validator files, **modifies** controllers and routes. Does NOT modify repositories.

## Input

From orchestrator:
- Phase 1 complete (all repositories exist in `src/modules/<name>/<name>.repository.ts`)
- List of modules to process (from roadmap, lowest risk first)

## Output per Module

In `src/modules/<nombre>/`:

```
├── <nombre>.service.ts           # Business logic (new)
├── <nombre>.controller.ts        # Thin HTTP handler (modified from existing)
├── <nombre>.routes.ts            # Routes + Zod middleware (modified from existing)
├── <nombre>.validator.ts         # Zod schemas (new)
└── dtos/
    ├── Create<nombre>.dto.ts     # Optional — creation type
    └── Update<nombre>.dto.ts     # Optional — update type
```

## Step-by-Step per Module

### Step 1: Analyze the current controller

Read the existing controller at `src/controllers/<entidad>.controller.ts`. Identify:

1. **Business logic** (validations, calculations, DB queries, authorization checks) → moves to service
2. **HTTP handling** (req.params, req.body, res.json, res.status) → stays in controller
3. **Error handling** (try-catch blocks, `res.status(500)`) → refactor to `next(error)` pattern

### Step 2: Create the service

```typescript
// modules/<nombre>/<nombre>.service.ts
import { injectable, inject } from 'tsyringe';
import { I<Nombre>Repository } from './<nombre>.repository';
import { <Entity> } from '@entities/<Entity>.entity';
import { AppError } from '@core/errors/AppError';

@injectable()
export class <Nombre>Service {
  constructor(
    @inject('I<Nombre>Repository') private repo: I<Nombre>Repository
  ) {}

  async getAll(): Promise<<Entity>[]> {
    return this.repo.findAll();
  }

  async getById(id: number): Promise<<Entity>> {
    const entity = await this.repo.findById(id);
    if (!entity) throw new AppError(`${<Entity>.name} no encontrado`, 404);
    return entity;
  }

  async create(data: Partial<<Entity>>): Promise<<Entity>> {
    // Business validation from the original controller goes here
    return this.repo.create(data);
  }

  async update(id: number, data: Partial<<Entity>>): Promise<<Entity>> {
    await this.getById(id); // ensure exists
    return this.repo.update(id, data);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id); // ensure exists
    await this.repo.delete(id);
  }
}
```

### Step 3: Refactor the controller

```typescript
// modules/<nombre>/<nombre>.controller.ts
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { <Nombre>Service } from './<nombre>.service';

@injectable()
export class <Nombre>Controller {
  constructor(
    @inject('I<Nombre>Service') private service: <Nombre>Service
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAll();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(Number(req.params.id));
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.update(Number(req.params.id), req.body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
```

### Step 4: Add Zod validation

```typescript
// modules/<nombre>/<nombre>.validator.ts
import { z } from 'zod';

export const create<Nombre>Schema = z.object({
  body: z.object({
    nombre: z.string().min(1),
    // ... fields from entity, matching current controller validation
  }),
});

export const update<Nombre>Schema = z.object({
  body: z.object({
    nombre: z.string().min(1).optional(),
    // ... partial version of create
  }),
});

export const getByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be numeric'),
  }),
});
```

### Step 5: Update routes

```typescript
// modules/<nombre>/<nombre>.routes.ts
import { Router } from 'express';
import { validate } from '@core/middleware/validate';
import {
  create<Nombre>Schema,
  update<Nombre>Schema,
} from './<nombre>.validator';
import { <Nombre>Controller } from './<nombre>.controller';

// Controller will be resolved from DI container in Phase 3
// For now, instantiate directly with a TODO marker:
// TODO: resolve from DI container (Phase 3)
export function create<Nombre>Routes(controller: <Nombre>Controller): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', validate(create<Nombre>Schema), controller.create);
  router.put('/:id', validate(update<Nombre>Schema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
```

## Business Logic Migration Rules

When moving logic from controller to service, follow these guidelines:

| Controller Pattern | Service Destination |
|-------------------|--------------------|
| `const exists = await repo.findOne(...)` | `async validateExists()` or inline in service method |
| `if (!req.body.nombre) return res.status(400)` | Zod schema `nombre: z.string().min(1)` |
| `const total = items.reduce(...)` | Private service method `calculateTotal()` |
| `const queryBuilder = ...; query.where(...)` | Repository custom query method |
| Duplicate name check | Service method `validateUniqueName()` |
| Status/state transitions | Service method with business rules |

## What NOT to do

- ❌ Do NOT commit a module if the old controller still exists in `src/controllers/` (delete or redirect)
- ❌ Do NOT modify repository files
- ❌ Do NOT add HTTP-specific logic (req, res) to services
- ❌ Do NOT remove the `@injectable()` and `@inject()` decorators — Phase 3 needs them
- ❌ Do NOT change route paths or HTTP methods

## Validation (per module)

After completing each module:

1. Delete the old controller file from `src/controllers/<entidad>.controller.ts`
2. Remove old controller import from `src/app.ts` or its route registration
3. Add new route registration in `src/app.ts` (temporary wiring — will be cleaned in Phase 3):
   ```typescript
   import { create<Nombre>Routes } from '@modules/<nombre>/<nombre>.routes';
   import { <Nombre>Controller } from '@modules/<nombre>/<nombre>.controller';
   const <nombre>Routes = create<Nombre>Routes(new <Nombre>Controller(new TypeOrm<Nombre>Repository(dataSource)));
   app.use('/api/<nombre>', <nombre>Routes);
   ```
4. `npm run dev` — server must compile and start
5. `curl <endpoint>` — response must match baseline

## Completion Checklist

- [ ] All modules processed in specified order
- [ ] Each module has: service, thin controller, validator, updated routes
- [ ] Old controller files deleted from `src/controllers/`
- [ ] New routes registered in `app.ts`
- [ ] Server compiles and runs
- [ ] All endpoints return identical responses to baseline
- [ ] Zod validation works (test with invalid input: `curl -X POST -d '{}' -H 'Content-Type: application/json' <endpoint>`)
