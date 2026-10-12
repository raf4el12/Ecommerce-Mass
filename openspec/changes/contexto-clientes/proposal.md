# Propuesta: Contexto Clientes (cliente, persona, empresa, direcciones, tarjetas)

> Estado: **propuesta**. Contexto de soporte.

## Intención

Dar un solo dueño a los datos personales y de contacto del cliente. Hoy están duplicados: `Usuario.direccion/ciudad/codigoPostal/telefono` conviven con `Direccion` (con dirección principal) y con `Persona`/`Empresa`. La pantalla de perfil (`profile.jsx`, 605 líneas) escribe en dos endpoints distintos para guardar un mismo formulario. Además, la gestión de tarjetas guardadas no funciona (`metodopago.jsx:148` lanza un `ReferenceError`) y, tal como está diseñada, enviaría el número completo de la tarjeta al backend.

## ¿Cambia comportamiento observable?

Sí:

- **Migración de datos:** los campos de dirección de `Usuario` pasan a una `Direccion` principal (si el usuario no tiene ya una) y `telefono` pasa a `Persona`/`Cliente`. Las columnas viejas se eliminan en una segunda migración, cuando el front ya no las lea.
- `GET/PUT /api/clientes/me` pasa a ser el único endpoint del perfil. `PUT /api/usuarios/update/:id` queda solo para el admin.
- **Tarjetas guardadas:** según la decisión abierta, se eliminan o se reimplementan con MercadoPago.

## Alcance

### Incluido

- `modules/clientes/`: `clientes/` (Cliente, Persona, Empresa, TipoCliente), `direcciones/` y `tarjetas/` (según la decisión).
- Zod en todas las rutas. Reglas de dueño (ya vigentes desde `hardening-seguridad`) dentro del módulo.
- Front: `features/perfil/` (perfil, direcciones, tarjetas y "mis pedidos" con la API de ventas). `profile.jsx` se parte en formulario de datos, cambio de contraseña y secciones.
- Revisión de `Pedido.cliente` (relación a `Cliente`): ¿se llena hoy? Si no, se completa al crear el pedido o se elimina.

### Excluido

- Credenciales y roles (`contexto-identidad`).

## Capacidades

### Modificadas

- `perfil-cliente`: un dueño y un endpoint por dato; direcciones con una principal única.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Usuarios con dirección en `Usuario` y también en `Direccion`, distintas | La migración no pisa: si ya hay una principal, el dato viejo se guarda como dirección secundaria |
| El checkout lee la dirección desde `Usuario` | Inventario de lecturas con grep antes de quitar las columnas; dos migraciones separadas |

## Dependencias

- `contexto-identidad`.

## Decisiones abiertas (del negocio)

- **Tarjetas guardadas:**
  - (a) **eliminar** la función (recomendado si no se usa: hoy está rota y no sirve para cobrar), o
  - (b) reimplementarla con la API de *Customers & Cards* de MercadoPago, de modo que el backend solo guarde el id de tarjeta del proveedor y los últimos 4 dígitos, sin recibir nunca el número completo.

## Criterios de éxito

- [ ] `Usuario` no tiene columnas de dirección ni teléfono.
- [ ] El perfil se guarda con una sola request.
- [ ] Ninguna request del front envía un número de tarjeta completo (revisión del código + test del formulario).
