---
name: solid-clean-arch-migration
description: Global orchestrator for the incremental Clean Architecture + SOLID migration of TiendasMass (Express+TypeORM backend, React+Vite frontend). Reads SOLID_CLEAN_ARCH_ROADMAP.md, delegates specialized phases to sub-agent skills (repository-architect, service-migrator, di-wiring, api-unifier, component-splitter, cleanup-engineer), and consolidates results. Use this skill whenever the user initiates or asks about the clean architecture refactor, SOLID migration, or any phase of the roadmap.
license: MIT
metadata:
  author: rafael
  version: "2.0.0"
  roadmap: SOLID_CLEAN_ARCH_ROADMAP.md
  sub_agents:
    - repository-architect
    - service-migrator
    - di-wiring
    - api-unifier
    - component-splitter
    - cleanup-engineer
---

# Orchestrator: SOLID + Clean Architecture Migration

This is the **coordinator** for the phased refactor. It runs in the main conversation, reads the roadmap, delegates each phase to a real **subagent** (via the `Agent` tool), validates results, and reports progress.

The six specialists are real Claude Code subagents defined in `.claude/agents/` (`repository-architect`, `service-migrator`, `di-wiring`, `api-unifier`, `component-splitter`, `cleanup-engineer`). Launch them with the `Agent` tool using their `subagent_type`. A subagent cannot spawn another subagent, so all delegation happens here in the main thread.

## Multi-Agent Architecture

```
Orchestrator (this skill, main thread)
  ├── Phase 0 (Preparation) → executes directly
  ├── Phase 1 → Agent(subagent_type="repository-architect")
  ├── Phase 2 → Agent(subagent_type="service-migrator")
  ├── Phase 3 → Agent(subagent_type="di-wiring")
  ├── Phase 4 → Agent(subagent_type="api-unifier")
  ├── Phase 5 → Agent(subagent_type="component-splitter")
  └── Phase 6 → Agent(subagent_type="cleanup-engineer")
```

## Prime Directive

**Never change functional behavior.** Same HTTP routes, same JSON shapes, same UI. The refactor is structural only — 100% backward compatible. Each phase must be independently deployable.

## Before Starting ANY Phase

1. Read `SOLID_CLEAN_ARCH_ROADMAP.md` in full (especially "Fases del Refactor", "Especificaciones Técnicas", "Notas para Agentes Autónomos").
2. Check the **Progreso** table at the bottom of the roadmap. Resume from the first phase that is not ✅.
3. Ensure work happens on branch `refactor/clean-arch` (create it from `main` if missing). Never refactor directly on `main`.
4. Confirm the app builds and runs before touching anything:
   - `sudo docker start tiendasmass_db 2>/dev/null; sleep 2`
   - `cd /home/rafael/TIENDAS_MASS_ADMIN/TiendasMassBack-main && npm run dev &`
   - `cd /home/rafael/TIENDAS_MASS_ADMIN/TiendasMassFront-main && npm run dev &`
5. Capture a baseline: hit key endpoints and note the response shapes so you can diff after.

## Delegation to Subagents

When a phase corresponds to a specialist, launch it with the `Agent` tool:

1. **Call `Agent`** with the matching `subagent_type` (e.g. `repository-architect`). The subagent's full contract lives in its `.claude/agents/*.md` definition — you don't need to restate it; just give it the job.
2. **In the `prompt`, provide:**
   - The exact phase and the module list to process
   - Any interfaces/types already produced by previous phases
   - The validation gate it must pass before reporting done
3. **For independent modules within a phase, launch multiple subagents in parallel** (multiple `Agent` calls in one turn, or `isolation: "worktree"` per agent to avoid file collisions), then reconcile.
4. **Wait for completion** of a phase before starting the next — never parallelize phases that have a sequential dependency.
5. **Run the validation gate** yourself after each phase, then update the roadmap.

### Parallelization Rules

| Can parallelize (multiple `Agent` calls) | Cannot parallelize (sequential `Agent` calls) |
|----------------|-------------------|
| Modules within Phase 1 (repos for independent entities) | Phase 1 → Phase 2 (services need repos) |
| Modules within Phase 2 (services for independent modules) | Phase 2 → Phase 3 (DI needs services) |
| Modules within Phase 4 (independent API modules) | Phase 3 → Phase 4 (frontend is independent) |
| Modules within Phase 5 (independent admin components) | Phase 4 → Phase 5 (API layer needed first) |
| | Phase 3 (DI wiring) is one coherent pass — keep it single-agent |
| | Phase 6 is last (needs everything settled) |

> Tip: when running several subagents in parallel on the backend, give each `isolation: "worktree"` so they don't fight over `app.ts`/`container.ts`; merge their branches before the phase validation gate.

## Phase Order (Do Not Skip Ahead)

0. **Preparation** (execute directly) → 
1. **Repositories** (→ repository-architect) → 
2. **Services + Controllers** (→ service-migrator) → 
3. **DI Wiring** (→ di-wiring) → 
4. **Frontend API Client** (→ api-unifier) → 
5. **Frontend Concern Separation** (→ component-splitter) → 
6. **Cleanup + Tests** (→ cleanup-engineer)

## Phase 0 — Direct Execution by Orchestrator

Since Phase 0 is pure setup with no refactoring, the orchestrator executes it directly:

1. Create branch `refactor/clean-arch` from `main`.
2. Install `tsyringe` in backend: `cd TiendasMassBack-main && npm install tsyringe`.
3. Verify `experimentalDecorators: true` and `emitDecoratorMetadata: true` in `TiendasMassBack-main/tsconfig.json`.
4. Create `src/core/container.ts` with empty `container` export.
5. Create `src/core/errors/AppError.ts` (extend existing `ApiError` from errorHandler).
6. Create directory structure: `src/modules/` with subdirs for each entity.
7. Configure `tsconfig.json` paths: `@core/*`, `@modules/*`, `@entities/*`.
8. Verify: `npm run dev` starts, `npm run seed` runs clean.

## Validation Gate (run after each module and each phase)

Backend:
```bash
curl -s http://localhost:5001/api/categorias | head -5
curl -s http://localhost:5001/api/productos | head -5
curl -s http://localhost:5001/api/subcategorias | head -5
```

Frontend:
```bash
cd /home/rafael/TIENDAS_MASS_ADMIN/TiendasMassFront-main && npm run build
```

A phase is **done** only when:
- App starts clean
- Affected endpoints/screens behave identically to baseline
- `npm run build` is green
- Sub-agent confirms all tasks complete

## After completing a phase

1. Update the **Progreso** table in `SOLID_CLEAN_ARCH_ROADMAP.md` (set the phase to ✅ with date).
2. Commit the roadmap update together with the phase work.
3. Summarize: files created/modified, what was validated, and which phase is next.

## Stop-and-ask triggers

- An endpoint you cannot test/verify.
- A cyclic dependency between modules → redesign, don't hack.
- A non-entity file > 400 lines → it likely needs a split; flag it.
- Any change that would alter a response shape or route → stop (violates prime directive).
- Untyped `any` with no justification → type it instead.

## Hard "do NOT" list

❌ Refactor TypeORM entities/relations
❌ Rename API endpoints or JSON fields
❌ Migrate DB/ORM
❌ Change Tailwind or Vite config
❌ Rename files other modules import (do it gradually)
❌ Change behavior of any kind
❌ Skip phases or change their order

## Key technical references (full code in the roadmap)

- **DI:** `tsyringe` — `container.registerSingleton(token, Impl)`, `@injectable()` controllers with `@inject('IXxxService')` constructor params; resolve controllers from the container in `app.ts`.
- **Repositories:** `I{Name}Repository` interface + `TypeOrm{Name}Repository` taking `DataSource` by constructor; CRUD only, no business logic, return entities.
- **Validation:** Zod schemas per route via the existing `validate` middleware.
- **Frontend:** single Axios instance in `src/api/client.ts` (token + 401 interceptors); one function per endpoint under `src/api/modules/`; data hooks under `hooks/`; admin components become presentational with data in `admin/hooks/`.
- **Target paths:** `@core/*`, `@modules/*`, `@entities/*` (configure in `tsconfig.json` paths during Phase 0).

When in doubt, the roadmap wins. If the roadmap is silent, prefer the smallest change that preserves behavior and matches existing patterns.
