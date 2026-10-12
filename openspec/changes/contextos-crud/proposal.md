# Propuesta: Contextos CRUD (catálogo, tiendas, configuración, reportes)

> Estado: **propuesta**. Al especificarlo se divide en tres changes que se pueden hacer en paralelo: `contexto-catalogo`, `contexto-tiendas-y-configuracion` y `contexto-reportes`.

## Intención

Migrar los contextos sin reglas de negocio complejas a la plantilla CRUD de `core-backend`: `routes`, `controller`, `service`, `schemas` y `entity` por recurso, con `Repository<T>` directo, sin interfaces de repositorio ni casos de uso (ADR-02, ADR-04). Del lado del front, reemplazar las pantallas casi idénticas del admin por `CrudPage`. `GestionCategorias` y `GestionSubcategorias` comparten el 80 % del código; `GestionProducto` tiene 857 líneas con tabla, modal y paginación propios.

## ¿Cambia comportamiento observable?

Sí, en lo puntual:

- **Paginación y filtros del lado del servidor** en los listados del admin (hoy `GestionProducto` trae todo y pagina en el cliente). Los endpoints públicos mantienen la paginación opcional que ya existe.
- **Dashboard con agregaciones SQL** (hoy trae todos los pedidos a memoria, `dashboard.controller.ts:21-46`). Los números son los mismos y la respuesta, más rápida.
- **Imágenes de productos:** se corrige que las subidas en producción no se sirvan, y se definen dónde persisten (decisión abierta).
- `GET /api/categorias` deja de traer todos los productos de cada categoría (`relations: ["estado", "productos"]`). Se agrega `?incluirProductos=true` para quien lo necesite (inventario de consumidores en el spec).

## Alcance

### Incluido

- `modules/catalogo/{productos,categorias,subcategorias}`. La lectura de stock viene de `inventario.api`; el stock no se escribe aquí.
- `modules/tiendas/`.
- `modules/configuracion/{master-table,estados}`.
- `modules/reportes/dashboard` (consultas de solo lectura sobre ventas, catálogo e inventario).
- Zod en todas las rutas. Respuestas paginadas `{ data, total, page, limit }` en los listados del admin.
- Front: `features/catalogo/` (público: catálogo, búsqueda, detalle, carruseles y filtros de subcategoría) y `features/admin/{productos,categorias,subcategorias,tiendas,estados,master-table,dashboard}/` sobre `CrudPage`/`DataTable`.

### Excluido

- Stock (`inventario`), pedidos (`ventas`) y métodos de pago (`pagos`).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El cambio de forma de los listados del admin (paginados) rompe consumidores | Solo se usan desde las pantallas que se migran en el mismo change |
| `Estado` genérico usado por Producto, Categoría y Subcategoría | Decisión abierta abajo; en cualquier caso, con migración de datos |

## Dependencias

- `core-backend` y `frontend-base-features` (`CrudPage`, `DataTable`, validadores). `contexto-inventario` para la lectura de stock.

## Decisiones abiertas

- **Futuro de la entidad `Estado`:** una vez que el usuario usa un enum (`contexto-identidad`), ¿Producto, Categoría y Subcategoría necesitan estados configurables o alcanza con un booleano `activo`? Recomendado: booleano. `GestionEstados` desaparece o se limita a lo que el negocio realmente configure.
- **Almacenamiento de imágenes:** Azure Blob Storage (recomendado: sobrevive a los deploys y escala) vs el disco de la Web App con una ruta persistente (`/home`).
- **`MasterTable`** (EAV con `additionalOne/Two/Three`): ¿qué catálogos guarda hoy? Si son pocos y estables, conviene reemplazarlos por tablas o enums con nombre.

## Criterios de éxito

- [ ] `controllers/`, `services/` y `routes/` legacy sin archivos de estos contextos.
- [ ] `GestionCategorias` y `GestionSubcategorias` son configuraciones de `CrudPage` de menos de 150 líneas cada una.
- [ ] El dashboard responde en < 300 ms con 10.000 pedidos de prueba.
- [ ] Una imagen subida en producción se ve después de un redeploy.
