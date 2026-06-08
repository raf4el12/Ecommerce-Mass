---
name: cleanup-engineer
description: Specialized agent for Phase 6 (final phase) of the Clean Architecture migration. Eliminates code duplication, consolidates auth logic, removes dead code, adds backend and frontend tests. Depends on all previous phases (1-5) being complete and the codebase fully migrated.
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  orchestrator: solid-clean-arch-migration
  phase: 6
---

# Cleanup Engineer (Phase 6)

**Scope:** Fullstack — both backend (`TiendasMassBack-main/src/`) and frontend (`TiendasMassFront-main/src/`).
**Goal:** Eliminate structural debt (duplication, dead code, inconsistent patterns), lock the architecture with tests.
**Contract:** Deletes unused files, merges duplicate modules, creates test infrastructure. Does NOT change business logic, API contracts, or UI behavior.

## Input

From orchestrator:
- Phases 1-5 complete
- Codebase fully migrated to Clean Architecture structure
- List of known duplications and consolidation targets

## Tasks

### Task A: Eliminate Duplicate Controllers

**Target:** `rol.controller.ts` vs `roles.controller.ts`

1. Read both files completely
2. Merge all unique endpoint handlers into a single `RolController` service
3. Delete the duplicate file
4. Update route registration (only one `rol.routes.ts`)
5. Verify: `GET /api/roles` still works

**Target:** Auth logic in `usuarios.controller.ts`

1. Read `auth.controller.ts` and the auth-related parts of `usuarios.controller.ts`
2. Move all login/JWT/OTP logic into `src/modules/auth/auth.service.ts`
3. Ensure `usuarios.controller.ts` only handles user CRUD, no auth
4. Verify: login, register, and OTP flows work from frontend

### Task B: Eliminate Dead Code

Search for and remove (after verifying nothing imports them):

| Pattern | Search Command | Action |
|---------|---------------|--------|
| Old controllers in `src/controllers/` | `ls src/controllers/*.ts` | Delete ALL — should have been migrated in Phase 2 |
| Old services in `src/services/` | `ls src/services/*.ts` | Verify each is either migrated or delete |
| Mock data | `src/data/mockData.jsx` | Delete if unused |
| Legacy CSS files | `src/components/car/car.css`, `src/components/categoria/categoria.css`, `src/pages/*.css` (checkbox) | Delete if styles are covered by Tailwind |
| `subcategoriaAPI.js` (docs file) | `src/utils/subcategoriaAPI.js` | Delete (its content should be in API modules) |
| Unused validator files | `src/utils/*validaciones.jsx` | Move to `src/utils/validators/` and verify imports |

### Task C: Consolidate Validation

1. Read `src/utils/*validaciones.jsx` files
2. If the same validation rules exist on frontend and backend, keep them in sync
3. Move frontend validators to `src/utils/validators/<entidad>.validator.ts`
4. Create a simple shared validation module for common rules (RUC, DNI, phone, email)

### Task D: Backend Tests

Set up vitest in backend:

1. `cd TiendasMassBack-main && npm install -D vitest`
2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       globals: true,
       environment: 'node',
       include: ['src/**/*.test.ts'],
       setupFiles: ['./src/test/setup.ts'],
     },
     resolve: {
       alias: {
         '@core': '/src/core',
         '@modules': '/src/modules',
         '@entities': '/src/entities',
         '@config': '/src/config',
       },
     },
   });
   ```
3. Add test script to `package.json`: `"test": "vitest run"`
4. Create `src/test/setup.ts` with test DataSource (use SQLite or mock)

Write tests (by priority):

| Priority | Test Type | Example | Quantity |
|----------|-----------|---------|----------|
| 1 | Repository tests | `TypeOrmCategoriaRepository` with real SQLite test DB | 1 per entity (happy path CRUD) |
| 2 | Service tests | `CategoriaService` with mocked repository | 2 per entity (happy + error/404) |
| 3 | Validator tests | Zod schema validation | 2 per entity (valid + invalid input) |
| 4 | Controller integration | SuperTest + Express app | 1 per endpoint (happy path) |

Repository test example:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource } from 'typeorm';
import { Categoria } from '@entities/Categoria.entity';
import { TypeOrmCategoriaRepository } from '@modules/categoria/categoria.repository';

describe('TypeOrmCategoriaRepository', () => {
  let dataSource: DataSource;
  let repo: TypeOrmCategoriaRepository;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Categoria],
      synchronize: true,
    });
    await dataSource.initialize();
    repo = new TypeOrmCategoriaRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should create and find a categoria', async () => {
    const created = await repo.create({ nombre: 'Test' });
    const found = await repo.findById(created.id);
    expect(found?.nombre).toBe('Test');
  });
});
```

### Task E: Frontend Tests

Extend existing Vitest setup:

1. Add test files for API modules:
   ```typescript
   // src/api/modules/__tests__/categorias.api.test.ts
   import { describe, it, expect, vi } from 'vitest';
   import client from '../../client';

   vi.mock('../../client');

   describe('getCategorias', () => {
     it('should call GET /api/categorias', async () => {
       vi.mocked(client.get).mockResolvedValue({ data: [] });
       const result = await getCategorias();
       expect(client.get).toHaveBeenCalledWith('/api/categorias');
     });
   });
   ```

2. Add test files for hooks:
   ```typescript
   // src/hooks/__tests__/useAdminCategorias.test.ts
   // Render hook via @testing-library/react-hooks
   ```

3. Add test files for presentational components:
   ```typescript
   // src/admin/components/__tests__/GestionCategorias.test.tsx
   // Render with mock props, verify UI renders correctly
   ```

### Task F: Run Full Test Suite

```bash
# Backend
cd TiendasMassBack-main && npm test

# Frontend
cd TiendasMassFront-main && npm test
```

## What NOT to do

- ❌ Do NOT change API endpoints, response shapes, or HTTP methods
- ❌ Do NOT rename TypeORM entity fields or relations
- ❌ Do NOT change Tailwind or Vite configuration
- ❌ Do NOT migrate the test database to MySQL (use SQLite in-memory for tests)
- ❌ Do NOT remove files without verifying no imports reference them
- ❌ Do NOT change component UI or behavior

## Validation

After all cleanup:

1. `cd TiendasMassBack-main && npm run build && npm run seed`
2. `cd TiendasMassFront-main && npm run build`
3. `npm test` passes in both projects
4. Full smoke test: navigate all public + admin screens
5. Verify endpoint responses haven't changed:
   ```bash
   for ep in categorias productos subcategorias estados roles; do
     echo "$ep: $(curl -s http://localhost:5001/api/$ep | head -c 100)"
   done
   ```

## Completion Checklist

- [ ] `rol.controller.ts` and `roles.controller.ts` merged
- [ ] Auth logic consolidated in `auth.service.ts`
- [ ] Old `src/controllers/` directory deleted
- [ ] Old `src/services/` directory deleted (or migrated)
- [ ] `src/data/mockData.jsx` deleted if unused
- [ ] Legacy CSS files cleaned up
- [ ] Frontend validators consolidated in `src/utils/validators/`
- [ ] Backend vitest configured: `npm test` runs and passes
- [ ] Frontend existing tests still pass, new tests added
- [ ] Both projects build and deploy cleanly
- [ ] `SOLID_CLEAN_ARCH_ROADMAP.md` Progreso table updated to ✅ for Phase 6
- [ ] Final commit: `refactor(cleanup): complete structural cleanup and tests`
