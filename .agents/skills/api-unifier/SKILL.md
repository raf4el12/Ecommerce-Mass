---
name: api-unifier
description: Specialized agent for Phase 4 of the Clean Architecture migration. Unifies all frontend HTTP communication into a single Axios client, migrates all raw fetch() calls, replaces hardcoded localhost URLs with environment variables, and creates typed API modules per resource. Depends on Phase 3 being complete (backend stable).
license: MIT
metadata:
  author: rafael
  version: "1.0.0"
  orchestrator: solid-clean-arch-migration
  phase: 4
---

# API Unifier (Phase 4)

**Scope:** Frontend only (`TiendasMassFront-main/src/`).
**Goal:** Single Axios client for all HTTP calls. Zero hardcoded URLs. Zero raw `fetch()` calls.
**Contract:** Creates API module files, modifies components/hooks. Does NOT change UI rendering or component structure.

## Input

From orchestrator:
- Phase 3 complete (backend stable with DI wiring)
- List of files containing `localhost:5001` and `fetch()` calls (via grep)

## Output

```
src/api/
├── client.ts                    # Axios instance (refactored from existing axios.instance.js)
├── modules/
│   ├── categorias.api.ts
│   ├── productos.api.ts
│   ├── subcategorias.api.ts
│   ├── pedidos.api.ts
│   ├── auth.api.ts
│   ├── usuarios.api.ts
│   ├── direcciones.api.ts
│   ├── master-table.api.ts
│   ├── dashboard.api.ts
│   ├── tarjetas.api.ts
│   ├── checkout.api.ts          # Payment + checkout endpoints
│   └── tipos-cliente.api.ts
```

## Steps

### Step 1: Refactor Axios Client

```typescript
// src/api/client.ts
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### Step 2: Create `.env` and `.env.example`

```
# TiendasMassFront-main/.env
VITE_API_URL=http://localhost:5001
```

```
# TiendasMassFront-main/.env.example
VITE_API_URL=http://localhost:5001
```

### Step 3: Create API Modules

Each file follows the same pattern — one function per endpoint:

```typescript
// src/api/modules/categorias.api.ts
import client from '../client';
import type { Categoria } from '../../types';  // or inline type

export const getCategorias = (): Promise<Categoria[]> =>
  client.get('/api/categorias').then(r => r.data);

export const getCategoriaById = (id: number): Promise<Categoria> =>
  client.get(`/api/categorias/${id}`).then(r => r.data);

export const createCategoria = (data: Partial<Categoria>): Promise<Categoria> =>
  client.post('/api/categorias', data).then(r => r.data);

export const updateCategoria = (id: number, data: Partial<Categoria>): Promise<Categoria> =>
  client.put(`/api/categorias/${id}`, data).then(r => r.data);

export const deleteCategoria = (id: number): Promise<void> =>
  client.delete(`/api/categorias/${id}`);
```

Special cases:
- **File uploads** (productos with images): use `FormData` with `Content-Type: multipart/form-data`
- **Query params** (product filters, pagination): pass as `params` config option
- **PATCH endpoints** (partial updates on pedidos): use `client.patch()`

### Step 4: Migrate each file

For each file found by grep, replace:

| Before | After |
|--------|-------|
| `fetch('http://localhost:5001/api/...')` | `client.get('/api/...')` |
| `fetch(url, { method: 'POST', body: ... })` | `client.post('/api/...', data)` |
| `const res = await fetch(...); return res.json()` | `return client.get(...).then(r => r.data)` |
| `import axios from 'axios'; axios.get(...)` | `import client from '../../api/client'; client.get(...)` |

**Manually verify each replacement** — some `fetch()` calls may have custom error handling, redirect logic on 401, or special headers. Those must be preserved, not dropped.

### Migration Order (most impactful first)

1. `src/services/api/productos.api.js` — already uses Axios; standardize to the new pattern
2. `src/services/api/axios.instance.js` — refactor to `src/api/client.ts`
3. `src/hooks/useMasterTable.js` — replace fetch + hardcoded URL
4. `src/hooks/useOTPAuth.js` — replace fetch
5. `src/hooks/usePermitedModulos.js` — replace fetch
6. `src/admin/components/GestionCategorias.jsx` — replace fetch
7. `src/admin/components/GestionProducto.jsx` — replace fetch (keep FormData for upload)
8. `src/admin/components/GestionSubcategorias.jsx` — replace fetch
9. `src/admin/components/GestionUsuarios.jsx` — replace fetch
10. `src/admin/components/GestionPermisos.jsx` — replace fetch
11. `src/admin/components/GestionEstados.jsx` — replace fetch
12. `src/admin/components/GestionTienda.jsx` — replace fetch
13. `src/admin/components/GestionMetodoPago.jsx` — replace fetch
14. `src/admin/components/GestionMasterTable.jsx` — replace fetch
15. `src/admin/components/Dashboard.jsx` — replace fetch
16. `src/admin/components/ReportesPedidos.jsx` — replace fetch
17. `src/components/checkout/services/checkoutService.js` — replace fetch
18. `src/components/checkout/services/paymentService.js` — replace fetch
19. `src/components/checkout/steps/Step1Shipping.jsx` — replace URL construction
20. `src/components/checkout/components/OrderSummary.jsx` — replace URL construction
21. `src/components/SubcategoriaFilter.jsx` — replace fetch
22. `src/components/perfil/*.jsx` — replace fetch
23. `src/components/auth/*.jsx` — replace fetch
24. `src/components/productos/productos.jsx` — replace fetch
25. `src/pages/*.jsx` — any remaining fetch calls

### What NOT to do

- ❌ Do NOT change component rendering logic or JSX structure
- ❌ Do NOT change state management patterns (useState, useEffect, Context)
- ❌ Do NOT delete existing axios.instance.js until all imports are migrated
- ❌ Do NOT rename or restructure utility/validation files in `src/utils/`
- ❌ Do NOT touch backend files

### Validation

After migrating all files:

1. `npm run build` — must compile without errors
2. `npm run dev` — must start without runtime errors
3. Navigate to every section of the app and verify data loads correctly:
   - Home page → products, categories load
   - Catalog page → filter by category
   - Admin → login, CRUD operations on all entities
   - Checkout → shipping, payment options load
   - User profile → addresses, orders load
4. Check browser console for 0 network errors related to API calls
5. `grep -r "localhost:5001" src/ --include="*.{jsx,tsx,js,ts}"` → should return 0 results

## Completion Checklist

- [ ] `src/api/client.ts` created with token + 401 interceptors
- [ ] `.env` and `.env.example` files created
- [ ] All API modules created in `src/api/modules/`
- [ ] All `fetch()` calls replaced with `client` calls
- [ ] All `localhost:5001` occurrences eliminated
- [ ] `npm run build` green
- [ ] Full app smoke test passes
