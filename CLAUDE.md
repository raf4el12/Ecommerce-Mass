# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

Monorepo with two independently-installed apps. There is **no root `package.json`** — run `npm` commands inside each app directory:

- `TiendasMassBack-main/` — REST API (Node + Express + TypeScript + TypeORM, MySQL 8).
- `TiendasMassFront-main/` — SPA (React 19 + Vite + Tailwind), includes public store **and** admin panel.

## Commands

Backend (`cd TiendasMassBack-main`):
- `npm run dev` — hot-reload dev server on `http://localhost:5001` (ts-node-dev).
- `npm run build` — `tsc` → `dist/` (also copies `src/keys` and `src/public`).
- `npm start` — run compiled `dist/app.js`.
- `npm run seed` — load sample data (`src/scripts/seed.ts`).
- `docker compose up -d` — MySQL 8.0 on `:3306` (db `tiendasmass`).
- **No automated tests** — `npm test` is a placeholder that exits 1. API verification is manual via `postman_tests/*.json` and the helper shell scripts (`load-test-data.sh`, `verify-subcategorias.sh`).

Frontend (`cd TiendasMassFront-main`):
- `npm run dev` — Vite dev server on `http://localhost:5173`.
- `npm run build` / `npm run preview`.
- `npm run lint` — ESLint (flat config, `eslint.config.js`).
- `npm test` — Vitest. `npm run test:ui`, `npm run test:coverage` also available. (Note: there is one test file, `tests/unit/checkout-validations.test.js`, but `vite.config.js` has no `test` block and jsdom/Testing Library aren't installed, so the setup file never loads. The `estabilizar-base` change fixes this.)

Both apps require a `.env` (copy from `.env.example`). The backend reads it via `dotenv/config` imported first in `app.ts`.

## Backend architecture

Classic layered Express app. Request flow:

```
routes/*.routes.ts → middlewares (auth/validate) → controllers/*.controller.ts → services/*.service.ts → entities (TypeORM)
```

- **Entry point** `src/app.ts` registers every router under `/api/...`, mounts MercadoPago routes under `/api/payments/mp`, then calls `AppDataSource.initialize()` before listening. Exposes `/health` and `/api/diagnostics`.
- **Data layer** `src/config/data-source.ts` — single `AppDataSource`. **`synchronize: true`** is on, so schema is auto-derived from `src/entities/*.entity.ts` on every boot; there are **no TypeORM migrations**. Changing an entity changes the live DB schema. The `src/scripts/*.sql` files are manual one-off data/schema scripts, not a migration system.
- **Auth & permissions** (see `DOCUMENTACION_SISTEMA_PERMISOS.md` for the full flow):
  - `verificarToken` middleware validates the JWT and sets `req.usuario` (payload with `userId`).
  - `requirePermiso(modulo, accion)` loads the user's `rol → rolPermisos → permiso` and checks a `Permiso(modulo, accion)` row. **Any role whose name contains `"admin"` bypasses all permission checks.** `AdminModulo`/`AdminAccion` enums live in `Permiso.entity.ts`.
  - Permission model is `Rol` ←→ `RolPermiso` ←→ `Permiso`, with `Usuario.rolId`. Seed/bootstrap via `scripts/seed-permisos.js`, `create-roles.js`, `setup-almacenero.js`.
- **Validation** uses Zod schemas in `src/validators/` applied through the `validate` middleware.
- **Uploads** Multer (`middlewares/upload.ts`); product images served statically from `/uploads` (`src/public/uploads`).
- **Deployment** `TiendasMassBack-main/.github/workflows/main_tienditamassback.yml` (Azure Web App) and `TiendasMassFront-main/.github/workflows/azure-static-web-apps-*.yml` (Azure Static Web Apps) live inside the app folders. GitHub Actions only reads `.github/` at the repo root, so **neither workflow runs in this monorepo**. The `estabilizar-base` change moves them to the root.
- **Security status:** until the `hardening-seguridad` change lands, most routes have **no** auth (all catalog mutations, `/api/pedidos`, dashboard, kardex, master-table, estados…). There are two JWT payload shapes (`{userId}` from `/api/auth/*`, `{id}` from `/api/usuarios/login`), and the superadmin check is `rol.nombre.includes('admin')`. Don't assume a route is protected; check its router.
- **Inherited secrets:** the code was copied (without history) from the public team repo `GG-IM/TIENDAS_MASS_ADMIN`, which has its `.env` files and `src/keys/` committed. The local JWT key pair and `JWT_SECRET` were rotated on 2026-10-13. The MercadoPago credentials in the local `.env` files still belong to that team's account until replaced (task 0.5 of `estabilizar-base`). Never copy `.env` values or keys from that repo.
- **Build gotcha:** `npm run dev` uses `--transpile-only`, so type errors don't show up there. Run `npx tsc --noEmit` to typecheck. It currently fails at `src/services/kardex.service.ts:98`.

When adding a resource, the established pattern is: entity → service → controller → `*.routes.ts` → register in `app.ts`.

## Frontend architecture

- **Routing** `src/App.jsx` defines all routes. Public pages render under `PublicLayout`; the admin panel is gated by `components/AdminRoute` and mounted at `/admin/*`.
- **Admin panel** lives in `src/admin/` (menu in `admin/menuConfig.js`) plus `Gestion*.jsx` screens. These drive the same backend `/api` endpoints the permission system protects.
- **State** React Context only: `context/userContext.jsx` and `context/carContext.jsx` (cart).
- **Auth tokens in localStorage** — public store uses key `token`; admin panel uses separate `adminToken` / `adminUser` keys. Don't conflate them.
- **API access gotcha:** there are two conventions in the codebase. The newer `src/services/api/axios.instance.js` **hardcodes** `baseURL: 'http://localhost:5001/api'` (ignores `VITE_API_URL`), while other code reads `import.meta.env.VITE_API_URL`. When wiring new API calls, prefer the shared axios instance and be aware the base URL may need updating for non-local environments.

## Design system

UI follows **"Barrio Moderno"**: trust-blue `#0033A0` + mass-yellow `#FFD100`, Plus Jakarta Sans (headings) / Inter (body), large radii and soft shadows. Tokens live in `TiendasMassFront-main/tailwind.config.js` — use them rather than ad-hoc colors.

## Ongoing migration (Spec-Driven Development)

`SOLID_CLEAN_ARCH_ROADMAP.md` (**v2, 2026-10-11**) is the master plan. It contains the diagnosis, the target architecture (a modular monolith by bounded context, with DDD only in `ventas`, `inventario` and `pagos`), the ADRs, and the ordered list of changes. Each step is an OpenSpec-style change under `openspec/changes/<name>/` (`proposal.md`, `specs/`, `design.md`, `tasks.md`, `state.yaml`). Conventions and per-phase rules are in `openspec/config.yaml`.

- Work one change at a time, in roadmap order. Changes 1–3 (`estabilizar-base`, `sesion-y-cliente-http`, `hardening-seguridad`) are fully specified. The rest have only a proposal: write their spec, design and tasks right before applying, after a fresh exploration.
- New backend code goes in `src/core/` or `src/modules/<contexto>/`, never in the legacy `controllers/`, `services/` or `routes/`. New frontend code goes in `src/shared/` or `src/features/` and never uses `fetch()`, raw `axios` or hardcoded URLs.
- No repository interface+implementation for CRUD modules, and no DI container: modules are composed manually through `build<Ctx>(deps)` (ADR-03, ADR-04). `tsyringe` and `src/core/container.ts` from v1 Phase 0 are slated for removal.
- **Obsolete:** the subagents in `.claude/agents/` (`repository-architect`, `service-migrator`, `di-wiring`, `api-unifier`, `component-splitter`, `cleanup-engineer`) and the skills in `.agents/skills/` implement the v1 horizontal phases and contradict the v2 plan. Don't use them.

## Conventions

- Spanish is the working language for code identifiers, comments, commit messages, and docs.
- No automated backend test suite exists yet (`estabilizar-base` adds vitest + supertest against a `tiendasmass_test` DB). Until then, validate backend changes with the Postman collections and manual runs.
</content>
</invoke>
