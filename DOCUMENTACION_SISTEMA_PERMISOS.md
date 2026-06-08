# 📋 Sistema de Permisos y Roles - Documentación Completa

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE PERMISOS                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│     BASE DE DATOS (MySQL)    │
├──────────────────────────────┤
│ • Rol (id, nombre)           │
│ • Permiso (id, modulo, acc)  │
│ • RolPermiso (rolId, permId) │
│ • Usuario (id, email, rolId) │
└──────────────────────────────┘
         ▲
         │ Consultas SQL
         ▼
┌──────────────────────────────┐
│     BACKEND (Node.js)        │
├──────────────────────────────┤
│ GET /api/permisos/me/modulos │
│ GET /api/auth/admin/login    │
│ POST /api/permisos/seed      │
└──────────────────────────────┘
         ▲
         │ HTTP + JWT Token
         ▼
┌──────────────────────────────┐
│    FRONTEND (React.js)       │
├──────────────────────────────┤
│ • AdminRoute (valida acceso) │
│ • Navbar (muestra botón)     │
│ • Sidebar (filtra módulos)   │
│ • Dashboard (redirige)       │
└──────────────────────────────┘
```

---

## 🔄 Flujo Completo - Paso a Paso

### 1️⃣ USUARIO INTENTA LOGUEAR EN PANEL ADMIN

```
Usuario: jhon.cuba.123@gmail.com (Almacenero)
Contraseña: ••••••••

↓ Envía credenciales a /api/auth/admin/login
```

### 2️⃣ BACKEND VALIDA Y GENERA TOKEN

```typescript
// Backend: auth.controller.ts
1. Busca usuario en BD
2. Verifica contraseña
3. Valida que tenga ROL asignado
4. Genera JWT Token (válido 24h)
5. Retorna:
   {
     usuario: { id, email, nombre, rol },
     token: "eyJhbGci...",
     isAdmin: false  // NO es admin verdadero
   }
```

### 3️⃣ FRONTEND GUARDA CREDENCIALES

```javascript
// Frontend: AdminLogin.jsx
localStorage.setItem('adminToken', token);    // Token JWT
localStorage.setItem('adminUser', JSON.stringify(usuario)); // Datos del usuario
// Devuelve a /admin/dashboard
```

### 4️⃣ PROTECCIÓN EN RUTAS - AdminRoute

```javascript
// Frontend: AdminRoute.jsx
1. Verifica que exista adminToken en localStorage
2. Consulta /api/permisos/me/modulos con ese token
3. Backend retorna: { modulos: ['PRODUCTOS'], role: 'almacenero' }
4. Si tiene modulos → Permite acceso ✅
5. Si NO tiene modulos → Redirige a home ❌
```

### 5️⃣ NAVBAR DECIDE SI MUESTRA BOTÓN

```javascript
// Frontend: Navbar.jsx
1. Cuando usuario está logueado
2. Consulta /api/permisos/me/modulos
3. Si retorna modulos[] → Muestra "Panel de Administrador" ✅
4. Si retorna vacio → NO muestra botón ❌
```

### 6️⃣ DASHBOARD REDIRIGE SI NO TIENE ACCESO

```javascript
// Frontend: Dashboard.jsx
1. Al intentar acceder a /admin/dashboard
2. Verifica si DASHBOARD está en modulos[]
3. Si NO está → Redirige a primer módulo disponible
   • Almacenero: /admin/productos ✅
   • Cliente: /admin (sin acceso) ❌
4. Si SÍ está → Carga datos del dashboard ✅
```

### 7️⃣ SIDEBAR FILTRA DINÁMICAMENTE

```javascript
// Frontend: Sidebar.jsx
1. Consulta /api/permisos/me/modulos
2. Recibe: ['PRODUCTOS'] para almacenero
3. Filtra el menú:
   ✅ Dashboard → NO mostrar (no tiene permiso)
   ✅ Productos → MOSTRAR (tiene permiso)
   ✅ Categorías → NO mostrar (no tiene permiso)
   ✅ Usuarios → NO mostrar (no tiene permiso)
```

---

## 👥 Ejemplo: 3 Usuarios Diferentes

### Usuario 1: Administrador (admin@gmail.com)
```
BD: rol_id = 1 (administrador)
Permisos: 44 (todos los módulos × 4 acciones)

Resultado:
├─ Ve botón "Panel de Administrador" ✅
├─ Accede al Dashboard ✅
├─ Ve en el sidebar: TODO (11 módulos) ✅
└─ Puede: crear, editar, eliminar en TODO ✅
```

### Usuario 2: Almacenero (jhon.cuba.123@gmail.com)
```
BD: rol_id = 6 (almacenero)
Permisos: 4 (PRODUCTOS × READ, CREATE, UPDATE, DELETE)

Resultado:
├─ Ve botón "Panel de Administrador" ✅
├─ Intenta Dashboard → Redirige a Productos ✅
├─ Ve en el sidebar: SOLO Productos ✅
└─ Puede: crear, editar, eliminar productos SOLO ✅
```

### Usuario 3: Cliente (jhon.cuba.tlv@gmail.com)
```
BD: rol_id = 2 (cliente)
Permisos: 2 (DASHBOARD, PEDIDOS - solo READ)

Resultado:
├─ NO ve botón "Panel de Administrador" ❌
├─ Si intenta /admin → Rechaza a home ❌
├─ Solo usa: Home, Buscar, Carrito, Perfil ✅
└─ No puede: acceder a admin en absoluto ❌
```

---

## 📦 Base de Datos

### TABLA: Rol
```
┌─────┬──────────────────┐
│ id  │ nombre           │
├─────┼──────────────────┤
│  1  │ administrador    │
│  2  │ cliente          │
│  6  │ almacenero       │
└─────┴──────────────────┘
```

### TABLA: Permiso (44 registros = 11 módulos × 4 acciones)
```
┌────┬──────────────┬────────┐
│ id │ modulo       │ accion │
├────┼──────────────┼────────┤
│ 1  │ DASHBOARD    │ READ   │
│ 2  │ DASHBOARD    │ CREATE │
│ ... (más)
│ 41 │ PRODUCTOS    │ READ   │
│ 42 │ PRODUCTOS    │ CREATE │
│ 43 │ PRODUCTOS    │ UPDATE │
│ 44 │ PRODUCTOS    │ DELETE │
└────┴──────────────┴────────┘
```

### TABLA: RolPermiso (Asignación de permisos a roles)
```
┌────────┬────────────┐
│ rolId  │ permisoId  │
├────────┼────────────┤
│ 6      │ 41 (PROD-READ)     │
│ 6      │ 42 (PROD-CREATE)   │ ← Almacenero
│ 6      │ 43 (PROD-UPDATE)   │
│ 6      │ 44 (PROD-DELETE)   │
└────────┴────────────┘
```

### TABLA: Usuario
```
┌────┬────────────────────────────┬───────┐
│ id │ email                      │ rolId │
├────┼────────────────────────────┼───────┤
│ 1  │ jhon.cuba.123@gmail.com   │  6    │ ← Almacenero
│ 2  │ jhon.cuba.tlv@gmail.com   │  2    │ ← Cliente
└────┴────────────────────────────┴───────┘
```

---

## 🔑 Endpoint Clave: `/api/permisos/me/modulos`

Este es el **corazón del sistema**. Se consulta 3 veces:

```javascript
// 1️⃣ En Navbar (para mostrar/ocultar botón)
// 2️⃣ En AdminRoute (para permitir/denegar acceso)
// 3️⃣ En Sidebar (para filtrar módulos a mostrar)

// Respuesta para Almacenero:
{
  role: "almacenero",
  modulos: ["PRODUCTOS"]  ← Solo este módulo
}

// Respuesta para Administrador:
{
  role: "administrador",
  modulos: [
    "DASHBOARD", "PRODUCTOS", "CATEGORIAS", 
    "SUBCATEGORIAS", "USUARIOS", "PEDIDOS",
    "ESTADOS", "METODO_PAGO", "TIENDAS", 
    "METODO_ENVIO", "MASTER_TABLE"
  ]
}
```

---

## 📋 Scripts de Configuración

### seed-permisos.js 
✅ Crea 44 permisos (11 módulos × 4 acciones)
✅ Asigna permisos a roles: cliente, vendedor, administrador

```bash
node scripts/seed-permisos.js
```

**Resultado:**
```
✓ Permisos creados: 44
✓ Permisos asignados a rol: cliente (2 permisos)
✓ Permisos asignados a rol: vendedor (8 permisos)
✓ Permisos asignados a rol: administrador (44 permisos)
```

### setup-almacenero.js
✅ Crea rol "almacenero"
✅ Asigna usuario specific a ese rol
✅ Configura permisos: SOLO PRODUCTOS

```bash
node scripts/setup-almacenero.js
```

**Resultado:**
```
✓ Rol "almacenero" creado con ID: 6
✓ Permisos asignados al rol almacenero: 4 (SOLO PRODUCTOS)
✓ Usuario "Jhon Cristopher Cuba" asignado al rol "almacenero"
```

---

## 🎯 Resumen Rápido

```
┌─────────────────────┐
│  Usuario Inicia     │
│ Sesión (Admin)      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Backend valida y    │
│ genera JWT Token    │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Frontend guarda     │
│ token + usuario     │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ AdminRoute verifica │
│ permisos en BD      │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Navbar consulta     │
│ módulos permitidos  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Sidebar filtra      │
│ menú dinámicamente  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Dashboard redirige  │
│ si no tiene permiso │
└─────────────────────┘
```

---

## 🔐 Componentes de Seguridad

### AdminRoute.jsx
```javascript
- Verifica adminToken en localStorage
- Consulta /api/permisos/me/modulos
- Permite acceso si tiene módulos permitidos
- Redirige a home si no tiene permisos
```

### Navbar.jsx
```javascript
- Verifica permisos dinámicamente
- Solo muestra "Panel de Administrador" si tiene módulos
- Fallback para admins por nombre de rol
```

### Dashboard.jsx
```javascript
- Verifica permiso en DASHBOARD
- Redirige al primer módulo disponible si no tiene acceso
- Carga datos del dashboard si tiene permiso
```

### Sidebar.jsx
```javascript
- Consulta /api/permisos/me/modulos
- Filtra menú según módulos permitidos
- Muestra solo opciones disponibles
```

---

## 📊 Módulos Disponibles

```
1. DASHBOARD       → Acceso a estadísticas generales
2. PRODUCTOS      → Gestionar catálogo
3. CATEGORIAS     → Gestionar categorías
4. SUBCATEGORIAS  → Gestionar subcategorías
5. USUARIOS       → Gestionar usuarios
6. PEDIDOS        → Ver reportes de pedidos
7. ESTADOS        → Gestionar estados
8. METODO_PAGO    → Gestionar métodos de pago
9. TIENDAS        → Gestionar tiendas
10. METODO_ENVIO   → Gestionar métodos de envío
11. MASTER_TABLE   → Gestionar tabla maestra
```

---

## 🛠️ Cómo Crear un Nuevo Rol

### Paso 1: Editar seed-permisos.js

```javascript
const permisoPorRol = {
  miNuevoRol: [
    { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.READ },
    { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.CREATE },
    // Agregar más permisos
  ]
};
```

### Paso 2: Ejecutar seed

```bash
node scripts/seed-permisos.js
```

### Paso 3: Asignar usuario al rol

```sql
UPDATE Usuario SET rolId = (SELECT id FROM Rol WHERE nombre = 'miNuevoRol') 
WHERE email = 'usuario@gmail.com';
```

---

## 🚀 Cómo Crear un Script Setup Personalizado

Ejemplo: setup-vendedor.js

```javascript
const connection = await mysql.createConnection(dbConfig);

// 1. Crear rol
const [result] = await connection.query(
  'INSERT INTO Rol (nombre) VALUES (?)',
  ['vendedor']
);
const vendedorRolId = result.insertId;

// 2. Asignar permisos
const permisosVendedor = ['PRODUCTOS', 'CATEGORIAS', 'TIENDAS'];
for (const modulo of permisosVendedor) {
  // ... código para asignar
}

// 3. Asignar usuario
await connection.query(
  'UPDATE Usuario SET rolId = ? WHERE email = ?',
  [vendedorRolId, 'vendedor@gmail.com']
);
```

---

## ✅ Checklist de Implementación

- [x] Crear tablas: Rol, Permiso, RolPermiso
- [x] Crear endpoint /api/permisos/me/modulos
- [x] Modificar auth/admin/login para retornar JWT
- [x] Crear AdminRoute con validación de permisos
- [x] Modificar Navbar para mostrar botón dinámicamente
- [x] Modificar Sidebar para filtrar módulos
- [x] Crear Dashboard con redireccionamiento
- [x] Script seed-permisos.js
- [x] Script setup-almacenero.js

---

## 📞 Soporte

Para agregar nuevos permisos:
1. Editar `src/entities/Permiso.entity.ts` (agregar módulo a enum)
2. Ejecutar `seed-permisos.js`
3. Configurar permisos en `setup-[rol].js`

Para cambiar permisos de usuario:
1. Ejecutar script de setup personalizado
2. O ejecutar query SQL directo

---

**Última actualización:** 18 de Febrero de 2026
