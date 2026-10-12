# Propuesta: Base del frontend por features

> Estado: **propuesta**.

## Intención

Dejar armado el esqueleto del frontend objetivo (`app/`, `shared/`, `features/`) y las piezas reutilizables que los changes de contexto van a necesitar para migrar sus pantallas sin copiar código: router con lazy loading, layouts, componentes de UI comunes, `CrudPage` genérico y validadores únicos. Además, corregir los bugs de navegación que no pertenecen a ningún contexto.

## ¿Cambia comportamiento observable?

No, salvo correcciones:

- `/producto/:id` hoy siempre sale en blanco (`App.jsx:68` monta un modal sin props). Pasa a ser una página real de detalle.
- El ícono de WhatsApp carga en el build (hoy usa una ruta de Windows como texto, `button/whatsappbutton.jsx:31`).
- El bundle inicial se achica: el admin, el checkout y el SDK de MercadoPago se cargan a demanda. `initMercadoPago` se ejecuta una sola vez (hoy dos: `main.jsx:10` y `App.jsx:48`).

## Alcance

### Incluido

- `src/app/router.tsx` con `React.lazy` + `Suspense` por área (público, checkout, perfil, admin). `src/app/providers.tsx` y `src/app/layouts/{PublicLayout,AdminLayout}.tsx`.
- `src/shared/ui/`: `Button`, `Input`, `Card` y `Pagination` (se mueven), `DataTable` (a partir de `AdminTable.jsx`), `Modal` (accesible: foco atrapado, `Esc`), `ConfirmDialog` (envuelve SweetAlert2 en un solo lugar) y `CrudPage` (listado + formulario en modal + crear/editar/eliminar, configurado por columnas, esquema y `api`).
- `src/shared/lib/validators.ts`: una sola fuente para email, teléfono, DNI/RUC, tarjeta (Luhn), código postal, etc., a partir de `utils/*validaciones.jsx`, `utils/validators.js` y `checkout/utils/validations.jsx`. Los 47 tests existentes se mueven y se amplían.
- `src/features/legal/` (términos, privacidad, reclamaciones), `src/features/institucional/` (contacto, trabaja con nosotros) y `src/features/home/`.
- Fin de `getAuthHeaders` (deprecado en `sesion-y-cliente-http`).
- Convenciones documentadas en `src/features/README.md`: nombres en PascalCase para componentes, `use*.ts` para hooks, `api.ts` por feature y tests junto al código.

### Excluido

- Migrar las pantallas de cada contexto: catálogo, checkout, perfil y admin las mueve su change, usando `CrudPage`/`DataTable`/`validators`.
- Reemplazar el CSS por Tailwind (`limpieza-final`).

## Capacidades

### Nuevas

- `estructura-frontend`: organización por features con carga diferida.
- `ui-compartida`: componentes y validadores reutilizables, con tests.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `CrudPage` demasiado genérico o demasiado rígido | Se diseña a partir de los dos casos más simples (estados, métodos de pago) y se valida con categorías y subcategorías (80 % duplicadas) en `contextos-crud` |
| Lazy loading rompe rutas profundas en Azure | `staticwebapp.config.json` con fallback (de `estabilizar-base`) y prueba manual de recarga en cada área |

## Dependencias

- `sesion-y-cliente-http`. Puede ir en paralelo con `migraciones-bd` y `core-backend`.

## Criterios de éxito

- [ ] El bundle inicial (home) no incluye código del admin ni del checkout (verificado con `vite build --report` o `rollup-plugin-visualizer`).
- [ ] `/producto/:id` muestra el producto y su URL se puede compartir.
- [ ] Un solo módulo de validadores, con tests, y ninguna regex de email duplicada en `src/`.
- [ ] `CrudPage` con tests de listado, alta, edición y borrado.
