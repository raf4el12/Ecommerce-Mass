# Propuesta: Contexto Identidad (usuarios, roles, permisos, OTP)

> Estado: **propuesta**. Contexto de soporte (plantilla CRUD + casos de uso donde hay reglas).

## Intención

`hardening-seguridad` dejó la autenticación correcta pero repartida en controllers legacy: `usuarios.controller.ts` tiene 512 líneas y `auth.controller.ts`, 309. Este change agrupa todo lo de identidad y acceso en `modules/identidad` y corrige dos debilidades del modelo:

- El estado del usuario depende del **nombre** de una fila editable de `Estado` (`estado.nombre === 'activo'`). Si un admin renombra "Activo", nadie puede iniciar sesión.
- `Usuario` mezcla credenciales (email, password, rol) con datos personales (`nombre`, `direccion`, `telefono`, `ciudad`, `codigoPostal`) que también viven en `Persona` y `Direccion`.

## ¿Cambia comportamiento observable?

Sí:

- **Estado del usuario como enum** (`ACTIVO`, `INACTIVO`, `SUSPENDIDO`) en una columna de `Usuario`. Se migra desde la relación con `Estado` según el nombre actual. La pantalla de usuarios del admin elige de una lista fija. `GestionEstados` deja de aplicar a usuarios.
- Las respuestas de usuario mantienen su forma, y `estado` sigue saliendo como texto. Los datos personales se siguen devolviendo, pero su dueño pasa a ser `clientes` (siguiente change).

## Alcance

### Incluido

- `modules/identidad/`: `auth/` (login, OTP, reenvío y verify, con los casos de uso que hoy están en `auth.controller`), `usuarios/`, `roles/`, `permisos/` y `setup/`.
- `Notificador` (puerto) + adaptador nodemailer, para que el OTP no dependa de nodemailer.
- `EstadoUsuario` (enum) + migración de datos.
- Validación Zod en todas las rutas (registro, alta administrativa, actualización y permisos).
- Front: `features/auth/` (login, OTP, registro y login de admin) y `features/admin/{usuarios,permisos}/` (con `CrudPage`), con `CrearAdmin` integrado en usuarios.
- Decidir la entidad `Empleado` (sin uso hoy): eliminarla con una migración o modelarla.

### Excluido

- Datos personales y direcciones (`contexto-clientes`).

## Capacidades

### Modificadas

- `autenticacion`, `autorizacion` y `cuentas-usuario`: misma conducta, ubicadas en un módulo, con el estado del usuario explícito.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Usuarios con estados de nombre no estándar ("Bloqueado", "Baja") | La migración lista los nombres distintos de `Activo`/`Inactivo` y pide el mapeo (MANUAL) antes de correr |

## Dependencias

- `core-backend`. Puede ir en paralelo con la ola 2 si hay capacidad.

## Decisiones abiertas

- **Token en cookie `httpOnly` + refresh token** vs `localStorage` (hoy). La cookie elimina el robo de token por XSS, pero requiere CSRF y CORS con credenciales. Recomendado evaluarlo aquí, con su spec propio.
- **¿"Olvidé mi contraseña"?** Hoy no existe. Si se quiere, va en este change.

## Criterios de éxito

- [ ] `controllers/{auth,usuarios,rol,permisos,setup}.controller.ts` y sus rutas legacy borrados.
- [ ] Renombrar el `Estado` "Activo" en el admin no afecta el login (test).
- [ ] `nodemailer` solo se importa en `modules/identidad/infrastructure`.
