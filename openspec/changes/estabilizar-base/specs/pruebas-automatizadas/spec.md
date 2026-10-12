# Pruebas automatizadas — Especificación (delta)

## Propósito

Ambas apps tienen una suite de tests que se ejecuta con `npm test`, aislada de los datos de desarrollo, sobre la que se apoyan todos los changes siguientes.

## ADDED Requirements

### Requirement: Suite del backend aislada

`npm test` en el backend MUST ejecutar vitest contra una base de datos cuyo nombre termine en `_test` y MUST abortar si no es así. La app MUST probarse sin abrir un puerto, mediante `createApp()` y supertest.

#### Scenario: TEST.1 — Protección contra la base de desarrollo

- GIVEN `DB_NAME=tiendasmass` en el entorno de test
- WHEN se ejecuta `npm test`
- THEN la suite aborta antes de conectarse
- AND el mensaje explica que `DB_NAME` debe terminar en `_test`

#### Scenario: TEST.2 — Aislamiento entre archivos de test

- GIVEN dos archivos de test que insertan productos
- WHEN se ejecutan en la misma corrida
- THEN cada archivo arranca con las tablas vacías más los seeds mínimos (estados, roles, tipos de cliente)

#### Scenario: TEST.3 — App sin puerto

- GIVEN `createApp()`
- WHEN un test hace `GET /health` con supertest
- THEN obtiene `200` sin que se haya llamado a `listen`

### Requirement: Suite del frontend con soporte de componentes

`npm test` en el frontend MUST ejecutar los tests de `tests/` con el entorno `jsdom` y el archivo de setup cargado.

#### Scenario: TEST.4 — Tests existentes

- GIVEN `tests/unit/checkout-validations.test.js`
- WHEN se ejecuta `npm test`
- THEN pasan los 47 tests

#### Scenario: TEST.5 — Test de componente

- GIVEN un test que renderiza `components/ui/Button.jsx` con `@testing-library/react`
- WHEN se ejecuta `npm test`
- THEN el test pasa usando los matchers de `@testing-library/jest-dom`
