---
name: solid-clean-arch-migration
description: Drives the incremental migration of the TiendasMass codebase (Express+TypeORM backend, React+Vite frontend) to Clean Architecture following SOLID principles, as specified in SOLID_CLEAN_ARCH_ROADMAP.md. Use this skill whenever the user asks to start, continue, or work on the "clean architecture refactor", "SOLID migration", "repository/service layer", "DI container", "API client unification", or any phase (0-6) of the roadmap. Enforces backward-compatibility, one-module-per-commit, and post-phase validation.
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  roadmap: SOLID_CLEAN_ARCH_ROADMAP.md
---

# SOLID + Clean Architecture Migration

Executes the phased refactor defined in **`SOLID_CLEAN_ARCH_ROADMAP.md`** (repo root). That file is the **single source of truth** for the target structure, phase tasks, technical specs and decisions. This skill is the *operating procedure* for carrying it out safely.

## Prime directive

**Never change functional behavior.** Same HTTP routes, same JSON shapes, same UI. The refactor is structural only and must stay 100% backward compatible. Each phase must be independently deployable.

## Before starting ANY work

1. Read `SOLID_CLEAN_ARCH_ROADMAP.md` in full (especially "Fases del Refactor", "Especificaciones Técnicas", "Notas para Agentes Autónomos").
2. Check the **Progreso** table at the bottom of the roadmap to see the current phase. Resume from the first phase that is not ✅.
3. Ensure work happens on branch `refactor/clean-arch` (create it from `main` if missing). Never refactor directly on `main`.
4. Confirm the app builds and runs before touching anything:
   - `cd TiendasMassBack-main && npm run dev`
   - `cd TiendasMassFront-main && npm run dev`
   - `docker ps` shows `tiendasmass_db` running.
5. Capture a baseline: hit key endpoints (`/api/categorias`, `/api/products`, `/api/subcategorias`) and note the response shapes so you can diff after.

## Phase order (do not skip ahead)

0. Preparación → 1. Repositorios (DIP+SRP) → 2. Servicios + Controllers livianos → 3. Dependency Injection (tsyringe) → 4. Frontend API client unificado → 5. Frontend separación de concerns → 6. Limpieza + tests.

Within Phase 2 and Phase 5, follow the **module/component order** listed in the roadmap (lowest risk first). Backend module order starts at `tipo-cliente`; admin component order starts at `GestionEstados`.

## Execution rules

- **One module/component per commit.** Message format: `refactor(<module>): <what>` (e.g. `refactor(categoria): add repository and service layer`).
- **Entities stay put.** Do not move or restructure TypeORM entities in `src/entities/`, and do not touch their relations or `synchronize`.
- **Keep routes & JSON identical.** No endpoint renames, no field renames in responses.
- **Validate after every module and every phase** (see below). Do not batch-refactor many modules without validating in between.
- **Match surrounding code style.** Reuse existing helpers (`ApiError`, the Zod `validate` middleware, the Axios instance) instead of inventing parallels.
- Prefer extending over rewriting (Axios client, Vitest config already exist).

## Validation gate (run after each module / phase)

Backend:
```bash
cd TiendasMassBack-main && npm run dev
curl -s http://localhost:5001/api/categorias | head
curl -s http://localhost:5001/api/products | head
```
Frontend:
```bash
cd TiendasMassFront-main && npm run build   # must stay green
npm run dev                                  # smoke-test the affected screen
```
A phase is **done** only when: app starts clean, affected endpoints/screens behave identically to baseline, and `npm run build` is green.

## After completing a phase

1. Update the **Progreso** table in `SOLID_CLEAN_ARCH_ROADMAP.md` (set the phase to ✅ with dates).
2. Commit the roadmap update together with the phase.
3. Summarize: files created/modified, what was validated, and what's next.

## Stop-and-ask triggers (do NOT improvise)

- An endpoint you cannot test/verify.
- A cyclic dependency between modules → redesign, don't hack.
- A non-entity file > 400 lines → it likely needs a split; flag it.
- Any change that would alter a response shape or route → stop, this violates the prime directive.
- Untyped `any` with no justification → type it instead.

## Hard "do NOT" list

❌ Refactor TypeORM entities/relations · ❌ rename API endpoints or JSON fields · ❌ migrate DB/ORM · ❌ change Tailwind or Vite · ❌ rename files other modules import (do it gradually) · ❌ change behavior of any kind.

## Key technical references (full code in the roadmap)

- **DI:** `tsyringe` — `container.registerSingleton(token, Impl)`, `@injectable()` controllers with `@inject('IXxxService')` constructor params; resolve controllers from the container in `app.ts`.
- **Repositories:** `I{Name}Repository` interface + `TypeOrm{Name}Repository` taking `DataSource` by constructor; CRUD only, no business logic, return entities.
- **Validation:** Zod schemas per route (`body`/`query`/`params`) via the existing `validate` middleware.
- **Frontend:** single Axios instance in `src/api/client.ts` (token + 401 interceptors); one function per endpoint under `src/api/modules/`; data hooks under `hooks/`; admin components become presentational with data in `admin/hooks/`.
- **Target paths:** `@core/*`, `@modules/*`, `@entities/*` (configure in `tsconfig.json` paths during Phase 0).

When in doubt, the roadmap wins. If the roadmap is silent, prefer the smallest change that preserves behavior and matches existing patterns.
