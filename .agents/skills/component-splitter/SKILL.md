---
name: component-splitter
description: Specialized agent for Phase 5 of the Clean Architecture migration. Extracts data fetching from admin (and public) components into custom hooks, separating container (logic) from presentation (UI). Depends on Phase 4 (API modules) being complete.
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  orchestrator: solid-clean-arch-migration
  phase: 5
---

# Component Splitter (Phase 5)

**Scope:** Frontend only (`TiendasMassFront-main/src/`).
**Goal:** Every component that makes API calls becomes a thin presentational component. Data fetching lives exclusively in hooks under `admin/hooks/` or `hooks/`.
**Contract:** Creates hook files, modifies admin/page components. Does NOT change API modules, routing, or global state (Context).

## Input

From orchestrator:
- Phase 4 complete (`src/api/modules/` exist for all endpoints)
- List of admin components and page components that contain inline data fetching

## Output

```
src/admin/hooks/
├── useAdminCategorias.ts
├── useAdminSubcategorias.ts
├── useAdminProductos.ts
├── useAdminUsuarios.ts
├── useAdminEstados.ts
├── useAdminTiendas.ts
├── useAdminMetodoPago.ts
├── useAdminMasterTable.ts
├── useAdminPermisos.ts
├── useAdminDashboard.ts
├── useAdminReportes.ts
└── useAdminSetup.ts

src/hooks/
├── useCategorias.ts         (public)
├── useProductos.ts          (public, refactored from existing)
├── useDirecciones.ts        (user profile)
├── useTarjetas.ts           (user profile)
└── usePedidos.ts            (user profile + checkout)
```

## Hook Pattern

Every hook follows this exact structure:

```typescript
// admin/hooks/useAdminCategorias.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '../../api/modules/categorias.api';

export function useAdminCategorias() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCategorias();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (input: any) => {
    const created = await createCategoria(input);
    setData(prev => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id: number, input: any) => {
    const updated = await updateCategoria(id, input);
    setData(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteCategoria(id);
    setData(prev => prev.filter(item => item.id !== id));
  }, []);

  return { data, loading, error, create, update, remove, refetch: fetch };
}
```

### CRUD Variations

| Entity Type | Hook Methods | Notes |
|-------------|-------------|-------|
| Read-only (dashboard, tipos-cliente) | `{ data, loading, error, refetch }` | Only fetch |
| Simple CRUD (categorias, estados) | `{ data, loading, create, update, remove, refetch }` | Full CRUD |
| Complex (productos, usuarios) | `{ data, loading, create, update, remove, refetch, search, uploadImage }` | Extra methods for search/file upload |
| Auth (login, register) | `{ login, register, logout, loading, error }` | No fetch on mount, action-based |

## Component Refactor Pattern

**Before (self-contained component):**

```tsx
function GestionCategorias() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5001/api/categorias')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <table>{data.map(...)}</table>;
}
```

**After (container hook + presentational component):**

```tsx
// admin/components/GestionCategorias.jsx — now presentational
function GestionCategorias({ data, loading, error, create, update, remove, refetch }) {
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  return <table>{data.map(...)}</table>;
}
```

The wrapping is done in the route definition or a parent:

```tsx
// In admin routes or a wrapper:
import { useAdminCategorias } from '../hooks/useAdminCategorias';

function GestionCategoriasPage() {
  const hook = useAdminCategorias();
  return <GestionCategorias {...hook} />;
}
```

## Migration Order (lowest risk first)

1. `GestionEstados` (simplest CRUD)
2. `GestionMetodoPago`
3. `GestionTienda`
4. `GestionCategorias`
5. `GestionSubcategorias`
6. `GestionMasterTable`
7. `GestionUsuarios`
8. `GestionPermisos`
9. `GestionProducto` (image upload = complex)
10. `Dashboard`
11. `ReportesPedidos`
12. `AdminLogin`
13. Public hooks: `useCategorias`, `useProductos`, `useDirecciones`, `usePedidos`

## What NOT to do

- ❌ Do NOT change API module files
- ❌ Do NOT change the Axios client
- ❌ Do NOT modify shared Context (`carContext`, `userContext`)
- ❌ Do NOT change routing or navigation logic
- ❌ Do NOT add new external dependencies
- ❌ Do NOT refactor components that have no data fetching (pure UI)

## Validation (per component)

After each component:

1. `npm run build` — must compile
2. Open the affected page in the browser
3. Verify the component loads data, displays it, and CRUD operations work
4. Check browser console for errors

## Completion Checklist

- [ ] All admin components split into hook + presentation
- [ ] All public data-fetching pages have hooks
- [ ] No component does inline `fetch()` or direct API calls
- [ ] `npm run build` green
- [ ] All admin screens work (CRUD, search, filter)
- [ ] All public screens work (catalog, profile, checkout)
