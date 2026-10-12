# Validación de entrada — Especificación (delta)

## Propósito

Una entrada inválida produce una respuesta 400 con detalle y nunca afecta la disponibilidad del proceso.

## MODIFIED Requirements

### Requirement: Errores de validación responden 400

El middleware `validate(schema)` MUST responder `400` con el cuerpo `{ status: "error", message: "Invalid data", details: [{ message }] }` cuando el esquema Zod rechaza la petición. Cualquier otro error dentro del middleware MUST pasarse a `next(err)`. El middleware MUST NOT producir rechazos de promesa no manejados.

> La forma del cuerpo se mantiene igual a la que el código pretendía devolver hoy. Se unifica con el resto de errores en `core-backend` (ADR-09).

#### Scenario: VAL.1 — Producto con precio inválido

- GIVEN un body de `POST /api/products` con `precio: "abc"`
- WHEN se procesa la petición
- THEN la respuesta es `400`
- AND `details` contiene al menos un elemento cuyo `message` menciona `precio`

#### Scenario: VAL.2 — El proceso sigue disponible

- GIVEN que acaba de ocurrir VAL.1
- WHEN se llama a `GET /health`
- THEN la respuesta es `200`

#### Scenario: VAL.3 — Error inesperado dentro del middleware

- GIVEN un esquema cuyo `parseAsync` lanza un error que no es `ZodError`
- WHEN se procesa la petición
- THEN el error llega al `errorHandler` global
- AND la respuesta es `500` en JSON
