# Propuesta: Migraciones de base de datos

> Estado: **propuesta**. El spec, el design y las tasks se escriben al iniciar el change, con una exploración fresca del esquema.

## Intención

Hoy el esquema lo define `synchronize: true` (`src/config/data-source.ts:16`): cada arranque altera la base para que coincida con las entidades. En producción eso significa que renombrar una columna o cambiar un tipo puede borrar datos sin aviso. Los changes de contexto van a mover y modificar entidades (`esSuperAdmin`, estado de usuario como enum, direcciones), así que primero el esquema tiene que pasar a ser explícito, versionado y revisable.

## ¿Cambia comportamiento observable?

No. La API y la UI quedan iguales. Cambia la operación: el esquema solo se modifica con migraciones revisadas en PR.

## Alcance

### Incluido

- Detectar la diferencia entre el esquema real de producción y las entidades (`typeorm schema:log` contra una copia de producción).
- Migración base `0001-esquema-inicial` que refleja el esquema real. En bases existentes se registra como ejecutada sin correrla; en bases nuevas (test, desarrollo limpio) crea todo.
- `synchronize: false`. Scripts `migration:generate`, `migration:run` y `migration:revert`.
- Los tests y el CI usan migraciones en lugar de `synchronize`, así cada PR valida que las migraciones aplican.
- Paso de migración en el deploy del backend.
- Archivar los `src/scripts/*.sql` manuales en `docs/historico/sql/`.

### Excluido

- Cambios de modelo de cualquier contexto (cada change de contexto trae sus migraciones).
- Seeds: siguen siendo scripts aparte (`npm run seed`).

## Capacidades

### Nuevas

- `esquema-versionado`: el esquema de la base se define por migraciones aplicadas en orden y registradas.

## Enfoque

1. Backup de producción y restauración en local.
2. `schema:log` contra la copia: si hay diferencias, se decide caso por caso si manda la entidad o la base.
3. Generar la migración base desde una base vacía y compararla con el `mysqldump --no-data` de producción.
4. Cambiar el `DataSource`, los scripts, el setup de tests y el CI.
5. Deploy: `migration:run` antes de iniciar la nueva versión.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| El esquema de producción difiere de las entidades (`synchronize` aplicó cosas en distinto orden, hay columnas huérfanas) | Media | `schema:log` + comparación de dumps antes de escribir la migración base |
| Un deploy corre una migración mala | Baja | Revisión en el PR, CI aplica las migraciones sobre una base vacía, backup previo y `migration:revert` |

## Plan de rollback

Volver a `synchronize: true` es un cambio de una línea. Las migraciones aditivas no necesitan revertirse.

## Dependencias

- `estabilizar-base` (setup de tests y CI).
- Acceso a un backup de producción (MANUAL).

## Decisiones abiertas

- **Cuándo corren las migraciones en Azure:** paso explícito del workflow (recomendado, porque falla antes de cambiar la versión) o `migrationsRun: true` al arrancar.
- **`Empleado` y `Reporte`:** si sus tablas están vacías en producción, ¿se eliminan aquí con una migración o se modelan en `contexto-identidad` / `reportes`?

## Criterios de éxito

- [ ] `synchronize: false` en todos los entornos.
- [ ] Sobre una base vacía, `npm run migration:run` produce un esquema idéntico (`mysqldump --no-data`) al de producción.
- [ ] El CI falla si una entidad cambia sin su migración (`migration:generate --check`).
