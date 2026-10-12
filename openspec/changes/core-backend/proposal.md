# Propuesta: Núcleo del backend (`src/core`) y contrato de módulos

> Estado: **propuesta**.

## Intención

Antes de migrar el primer contexto hay que fijar el piso común que todos van a usar: errores, validación, logging, transacciones, configuración completa, y el contrato de cómo un módulo se construye y se monta. Si no, cada contexto inventa el suyo y se repite lo que pasó con el plan v1.

## ¿Cambia comportamiento observable?

Sí, solo en la forma de los errores (ADR-09). Todas las respuestas de error pasan a ser `{ message, code, details? }`:

- La clave `message` se mantiene, y el front ya la lee (`data.message || data.error`, y desde `sesion-y-cliente-http` en un único lugar: `toApiError`).
- Desaparecen `{ error }` (131 usos) y `{ status: "error" }`.
- La validación pasa de `{ status, message: "Invalid data", details: [{ message }] }` a `{ message: "Datos inválidos", code: "VALIDATION_ERROR", details: [{ path, message }] }`.

## Alcance

### Incluido

- `src/core/errors/`: `AppError` (ya existe), `DomainError`, `NotFoundError`, `ConflictError`, `ForbiddenError`, `ValidationError`.
- `src/core/http/`: `errorHandler` con forma única, `validate` (movido desde `middlewares/`), `asyncHandler` (Express 4 no captura rechazos) y `upload` (movido).
- `src/core/logger.ts`: pino + pino-http con request id. Reemplaza los 88 `console.*` del backend a medida que cada módulo migra; desde este change es obligatorio en el código nuevo.
- `src/core/database/`: `data-source.ts` (movido) y `UnitOfWork` mínimo: `transaction(fn)` que entrega repositorios ligados al `EntityManager` transaccional.
- `env.ts` completo (MercadoPago, email, uploads). Prohibido `process.env` fuera de `core/config`.
- Contrato de módulo: `src/modules/<ctx>/index.ts` exporta `build<Ctx>(deps): { router, api }`. `createApp({ routers })`. `server.ts` es el composition root.
- Plantillas en `src/modules/_plantilla-nucleo/` y `_plantilla-crud/` (README + esqueleto), y la guía en `src/modules/README.md`.
- ESLint en el backend (typescript-eslint) + reglas de dependencias (`eslint-plugin-boundaries`): `domain` no importa `infrastructure`, `http`, `express` ni `typeorm`; un módulo solo importa el `index.ts` de otro; nada nuevo importa de `controllers/`, `services/` ni `routes/` legacy.
- Retirar `tsyringe` si todavía queda algún rastro (ADR-03).

### Excluido

- Migrar cualquier contexto: los routers legacy se montan tal cual a través de un adaptador `legacyRouters` hasta que su contexto migre.

## Capacidades

### Nuevas

- `errores-http`: forma única de error y mapeo de errores de dominio a status.
- `estructura-modulos`: contrato `build<Ctx>` y reglas de dependencia verificadas en CI.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Alguna pantalla depende de `data.error` | Desde `sesion-y-cliente-http`, todo pasa por `toApiError`, que lee `message` primero. Un grep de `\.error\b` en el front lo confirma antes del merge |
| Mover `data-source.ts` rompe los scripts (`seed`, `scripts/*.js`) | Alias `@core/database` y actualización de los scripts en el mismo PR |

## Dependencias

- `hardening-seguridad` (ya existe `src/core/auth`) y `migraciones-bd` (el `DataSource` sin `synchronize`).

## Decisiones abiertas

- `eslint-plugin-boundaries` vs `dependency-cruiser` para las reglas de capas.

## Criterios de éxito

- [ ] `grep -rn "res.status(.*).json({ *error" src` → 0.
- [ ] Un error de dominio lanzado en un caso de uso llega como `{ message, code }` con el status correcto (test).
- [ ] El CI falla si un archivo de `domain/` importa `typeorm` (test negativo de la regla).
- [ ] `src/modules/README.md` describe las dos plantillas, y `server.ts` monta módulos solo a través de `build<Ctx>`.
