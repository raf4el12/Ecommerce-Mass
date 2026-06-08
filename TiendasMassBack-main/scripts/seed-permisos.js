const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Jake170702',
  database: 'tiendasmass'
};

// Módulos y acciones disponibles
const AdminModulo = {
  DASHBOARD: 'DASHBOARD',
  PRODUCTOS: 'PRODUCTOS',
  CATEGORIAS: 'CATEGORIAS',
  SUBCATEGORIAS: 'SUBCATEGORIAS',
  ESTADOS: 'ESTADOS',
  MASTER_TABLE: 'MASTER_TABLE',
  METODO_PAGO: 'METODO_PAGO',
  METODO_ENVIO: 'METODO_ENVIO',
  TIENDAS: 'TIENDAS',
  USUARIOS: 'USUARIOS',
  PEDIDOS: 'PEDIDOS',
};

const AdminAccion = {
  READ: 'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

// Permisos por rol
const permisoPorRol = {
  // Cliente: solo lectura de dashboard y pedidos
  cliente: [
    { modulo: AdminModulo.DASHBOARD, accion: AdminAccion.READ },
    { modulo: AdminModulo.PEDIDOS, accion: AdminAccion.READ },
  ],
  // Vendedor: acceso a productos, categorías, tiendas
  vendedor: [
    { modulo: AdminModulo.DASHBOARD, accion: AdminAccion.READ },
    { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.READ },
    { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.CREATE },
    { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.UPDATE },
    { modulo: AdminModulo.CATEGORIAS, accion: AdminAccion.READ },
    { modulo: AdminModulo.SUBCATEGORIAS, accion: AdminAccion.READ },
    { modulo: AdminModulo.TIENDAS, accion: AdminAccion.READ },
    { modulo: AdminModulo.PEDIDOS, accion: AdminAccion.READ },
  ],
  // Administrador: acceso a todo
  administrador: Object.values(AdminModulo).flatMap(modulo =>
    Object.values(AdminAccion).map(accion => ({ modulo, accion }))
  ),
};

async function seedPermisos() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔧 Iniciando seeding de permisos...\n');

    // 1. Crear todos los permisos (módulo x acción)
    let permisosCreados = 0;
    for (const modulo of Object.values(AdminModulo)) {
      for (const accion of Object.values(AdminAccion)) {
        const [exists] = await connection.query(
          'SELECT id FROM Permiso WHERE modulo = ? AND accion = ?',
          [modulo, accion]
        );

        if (exists.length === 0) {
          await connection.query(
            'INSERT INTO Permiso (modulo, accion) VALUES (?, ?)',
            [modulo, accion]
          );
          permisosCreados++;
        }
      }
    }
    console.log(`✓ Permisos creados: ${permisosCreados}\n`);

    // 2. Asignar permisos a roles
    for (const [rolNombre, permisos] of Object.entries(permisoPorRol)) {
      const [rolResult] = await connection.query(
        'SELECT id FROM Rol WHERE nombre = ?',
        [rolNombre]
      );

      if (rolResult.length === 0) {
        console.log(`⚠ Rol "${rolNombre}" no existe. Saltando...`);
        continue;
      }

      const rolId = rolResult[0].id;

      // Limpiar permisos existentes
      await connection.query('DELETE FROM RolPermiso WHERE rolId = ?', [rolId]);

      // Insertar nuevos permisos
      for (const { modulo, accion } of permisos) {
        const [permisoResult] = await connection.query(
          'SELECT id FROM Permiso WHERE modulo = ? AND accion = ?',
          [modulo, accion]
        );

        if (permisoResult.length > 0) {
          const permisoId = permisoResult[0].id;
          await connection.query(
            'INSERT INTO RolPermiso (rolId, permisoId) VALUES (?, ?)',
            [rolId, permisoId]
          );
        }
      }

      console.log(`✓ Permisos asignados a rol: ${rolNombre} (${permisos.length} permisos)`);
    }

    console.log('\n✅ Seeding completado exitosamente!');

    // Mostrar resumen
    const [resumen] = await connection.query(`
      SELECT 
        r.nombre as rol, 
        COUNT(rp.id) as permisos
      FROM Rol r
      LEFT JOIN RolPermiso rp ON r.id = rp.rolId
      GROUP BY r.id, r.nombre
    `);

    console.log('\n📊 Resumen de permisos por rol:');
    console.table(resumen);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

seedPermisos();
