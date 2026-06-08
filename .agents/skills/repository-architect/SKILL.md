---
name: repository-architect
description: Specialized agent for Phase 1 of the Clean Architecture migration. Creates repository interfaces and TypeORM implementations for all backend modules, extracting DB access from controllers. Depends on Phase 0 (preparation) being complete. Consumes the SOLID_CLEAN_ARCH_ROADMAP.md target structure and patterns.
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  orchestrator: solid-clean-arch-migration
  phase: 1
---

# Repository Architect (Phase 1)

**Scope:** Backend only (`TiendasMassBack-main/src/`).
**Goal:** Create a repository layer for every entity, isolating all DB access behind interfaces.
**Contract:** Does NOT modify controllers, services, or routes. Only creates new files.

## Input

From orchestrator:
- Phase 0 completed (`src/core/container.ts`, `tsconfig.json` paths, `src/modules/` directory structure)
- List of entities that need repositories (from roadmap entity list)

## Output

For each module, two files in `src/modules/<nombre>/`:

```
src/modules/<nombre>/
├── <nombre>.repository.ts          # Interface + Implementation (same file)
```

If the module directory does not exist, create it.

## Pattern (exact)

Every repository file must follow this structure:

```typescript
import { DataSource, Repository } from 'typeorm';
import { <Entity> } from '@entities/<Entity>.entity';

// ── Interface ──────────────────────────────────────────────
export interface I<Nombre>Repository {
  findAll(): Promise<<Entity>[]>;
  findById(id: number): Promise<<Entity> | null>;
  findByIds(ids: number[]): Promise<<Entity>[]>;
  create(data: Partial<<Entity>>): Promise<<Entity>>;
  update(id: number, data: Partial<<Entity>>): Promise<<Entity>>;
  delete(id: number): Promise<void>;
}

// ── Implementation ─────────────────────────────────────────
export class TypeOrm<Nombre>Repository implements I<Nombre>Repository {
  constructor(private dataSource: DataSource) {}

  private get repo(): Repository<<Entity>> {
    return this.dataSource.getRepository(<Entity>);
  }

  async findAll(): Promise<<Entity>[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<<Entity> | null> {
    return this.repo.findOne({ where: { id } as any });
  }

  async findByIds(ids: number[]): Promise<<Entity>[]> {
    return this.repo.findByIds(ids);
  }

  async create(data: Partial<<Entity>>): Promise<<Entity>> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<<Entity>>): Promise<<Entity>> {
    await this.repo.update(id, data as any);
    return this.repo.findOneOrFail({ where: { id } as any });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
```

### Custom Query Methods

Add entity-specific query methods to the interface and implementation ONLY if:
- The method is used by the current controller (check `src/controllers/<entidad>.controller.ts`)
- The method cannot be expressed via generic `findAll`/`findById`

Example:
```typescript
export interface IProductoRepository {
  // ... base CRUD
  findByCategoriaId(categoriaId: number): Promise<Producto[]>;
  findBySubcategoriaId(subcategoriaId: number): Promise<Producto[]>;
  findWithFilters(filters: ProductFilters): Promise<Producto[]>;
}
```

## Module Order (process in this sequence)

1. `tipo-cliente` (simplest — only findAll)
2. `metodo-pago`
3. `metodo-envio`
4. `estado`
5. `tienda`
6. `categoria`
7. `subcategoria`
8. `direccion`
9. `master-table`
10. `cliente`
11. `tarjeta`
12. `rol`
13. `permiso`
14. `auth` (usuario login specific queries)
15. `usuario`
16. `producto`
17. `pedido`
18. `dashboard`
19. `setup`

## Adding Relations

When the entity has relations that the controller always loads (check for `relations:` in current controller code), add a convenience method:

```typescript
async findAllWithRelations(): Promise<<Entity>[]> {
  return this.repo.find({ relations: ['estado', 'categoria'] });
}
```

## What NOT to do

- ❌ Do NOT modify existing controllers, routes, or services
- ❌ Do NOT add business logic to repositories (validation, calculations, authorization)
- ❌ Do NOT remove `AppDataSource.getRepository()` from controllers yet (Phase 2 handles that)
- ❌ Do NOT move/rename entity files
- ❌ Do NOT change entity definitions or relations

## Validation

After creating all repositories:

1. `cd /home/rafael/TIENDAS_MASS_ADMIN/TiendasMassBack-main && npm run dev`
2. Verify the server starts without import/compilation errors
3. Hit key endpoints to confirm nothing broke: `curl -s http://localhost:5001/api/categorias | head -3`

## Completion Checklist

- [ ] All modules from the order list have `I{Nombre}Repository` + `TypeOrm{Nombre}Repository`
- [ ] Each repository has the base CRUD methods
- [ ] Entity-specific query methods match what controllers currently need
- [ ] Server compiles and runs
- [ ] Endpoints respond identically to baseline
