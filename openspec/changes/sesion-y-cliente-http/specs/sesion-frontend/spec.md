# Sesión del frontend — Especificación (delta)

## Propósito

Existe una sola sesión (token + usuario) para la tienda y el panel admin, con una sola forma de iniciarla y cerrarla.

## ADDED Requirements

### Requirement: Store de sesión único

La sesión MUST guardarse con las claves `token` y `usuario`: en `localStorage` si el usuario eligió "recordarme", y en `sessionStorage` si no. Al guardar en uno, MUST limpiar el otro. Los componentes MUST leer y escribir la sesión solo a través de `src/shared/auth/session.ts` o de `useUsuario()`.

#### Scenario: SES.1 — Login sin "recordarme"

- GIVEN el formulario de OTP verificado con `remember = false`
- WHEN se llama a `login(data, false)`
- THEN `sessionStorage` tiene `token` y `usuario`
- AND `localStorage` no tiene ninguno de los dos

#### Scenario: SES.2 — Login del admin

- GIVEN credenciales válidas en `/admin/login`
- WHEN el login responde con `{ usuario, token }`
- THEN la sesión queda guardada con las claves `token`/`usuario`
- AND no existen las claves `adminToken` ni `adminUser`
- AND el header de la tienda muestra al usuario como logueado

### Requirement: Migración de claves legacy

Al cargar la app, si existen `adminToken`/`adminUser` y no existe `token`, la sesión MUST adoptarlos como sesión en `localStorage`. En todos los casos, las claves `adminToken` y `adminUser` MUST eliminarse.

#### Scenario: SES.3 — Admin con sesión vieja

- GIVEN `localStorage` con `adminToken=x` y `adminUser={…}`, y sin `token`
- WHEN se carga la app
- THEN `getToken() === "x"`
- AND `adminToken` y `adminUser` ya no existen

### Requirement: Logout único

`logout()` MUST borrar `token` y `usuario` de ambos storages y la caché de permisos, y notificar a los suscriptores. Toda pantalla que ofrece "cerrar sesión" MUST usar esta función.

#### Scenario: SES.4 — Logout desde el sidebar del admin

- GIVEN una sesión activa en `/admin/productos`
- WHEN el usuario pulsa "Cerrar sesión" en el sidebar
- THEN la sesión queda vacía
- AND navegar a `/admin/dashboard` redirige a `/admin/login`
- AND el header de la tienda no muestra al usuario

### Requirement: Consumidores sin manejo manual del token

Las pantallas MUST NOT leer el token del storage ni recibirlo de `usuario`. Las requests lo obtienen del cliente HTTP.

#### Scenario: SES.5 — Checkout autenticado

- GIVEN un usuario logueado con productos en el carrito
- WHEN confirma el pedido en el checkout
- THEN `POST /api/pedidos` lleva `Authorization: Bearer <token>`

### Requirement: Sincronización entre pestañas

La sesión SHOULD reaccionar al evento `storage`: un logout en una pestaña cierra la sesión en las demás.

#### Scenario: SES.6 — Dos pestañas

- GIVEN dos pestañas con sesión en `localStorage`
- WHEN en una se hace logout
- THEN la otra deja de mostrar al usuario sin recargar
