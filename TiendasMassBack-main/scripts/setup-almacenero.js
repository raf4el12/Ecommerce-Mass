const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Jake170702',
  database: 'tiendasmass'
};

async function setupAlmaceneroUser() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔧 Configurando usuario Almacenero...\n');

    // 1. Crear rol "Almacenero" si no existe
    const [rolExists] = await connection.query(
      'SELECT id FROM Rol WHERE nombre = ?',
      ['almacenero']
    );

    let almaceneroRolId;
    if (rolExists.length === 0) {
      const [result] = await connection.query(
        'INSERT INTO Rol (nombre) VALUES (?)',
        ['almacenero']
      );
      almaceneroRolId = result.insertId;
      console.log(`✓ Rol "almacenero" creado con ID: ${almaceneroRolId}`);
    } else {
      almaceneroRolId = rolExists[0].id;
      console.log(`✓ Rol "almacenero" ya existe con ID: ${almaceneroRolId}`);
    }

    // 2. Obtener ID del permiso de PRODUCTOS
    const [productosPermiso] = await connection.query(
      'SELECT id FROM Permiso WHERE modulo = ?',
      ['PRODUCTOS']
    );

    if (productosPermiso.length === 0) {
      console.error('❌ Error: No se encontraron permisos para PRODUCTOS');
      return;
    }

    // Limpiar permisos existentes del rol
    await connection.query('DELETE FROM RolPermiso WHERE rolId = ?', [almaceneroRolId]);

    // 3. Asignar solo permisos de PRODUCTOS (SIN DASHBOARD)
    let permisosAsignados = 0;
    const permisosAAsignar = [
      { modulo: 'PRODUCTOS', accion: 'READ' },
      { modulo: 'PRODUCTOS', accion: 'CREATE' },
      { modulo: 'PRODUCTOS', accion: 'UPDATE' },
      { modulo: 'PRODUCTOS', accion: 'DELETE' },
    ];
    
    for (const { modulo, accion } of permisosAAsignar) {
      const [permisoResult] = await connection.query(
        'SELECT id FROM Permiso WHERE modulo = ? AND accion = ?',
        [modulo, accion]
      );

      if (permisoResult.length > 0) {
        const permisoId = permisoResult[0].id;
        await connection.query(
          'INSERT INTO RolPermiso (rolId, permisoId) VALUES (?, ?)',
          [almaceneroRolId, permisoId]
        );
        permisosAsignados++;
      }
    }

    console.log(`✓ Permisos asignados al rol almacenero: ${permisosAsignados} (SOLO PRODUCTOS con todas las acciones)`);

    // 4. Buscar y actualizar el usuario
    const userEmail = 'jhon.cuba.123@gmail.com';
    const [userResult] = await connection.query(
      'SELECT id, nombre FROM Usuario WHERE email = ?',
      [userEmail]
    );

    if (userResult.length === 0) {
      console.error(`❌ Error: Usuario con email "${userEmail}" no encontrado`);
      return;
    }

    const userId = userResult[0].id;
    const userName = userResult[0].nombre;

    // Actualizar el rol del usuario
    await connection.query(
      'UPDATE Usuario SET rolId = ? WHERE id = ?',
      [almaceneroRolId, userId]
    );

    console.log(`✓ Usuario "${userName}" (${userEmail}) asignado al rol "almacenero"`);

    // 5. Mostrar resumen final
    const [userUpdated] = await connection.query(
      `SELECT u.id, u.nombre, u.email, r.nombre as rol 
       FROM Usuario u 
       LEFT JOIN Rol r ON u.rolId = r.id 
       WHERE u.id = ?`,
      [userId]
    );

    const [userPermisos] = await connection.query(
      `SELECT DISTINCT p.modulo, p.accion
       FROM RolPermiso rp
       JOIN Permiso p ON rp.permisoId = p.id
       WHERE rp.rolId = ?
       ORDER BY p.modulo, p.accion`,
      [almaceneroRolId]
    );

    console.log('\n✅ Configuración completada!\n');
    console.log('📊 Usuario configurado:');
    console.table(userUpdated);
    
    console.log('\n📋 Permisos del rol "almacenero":');
    console.table(userPermisos);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

setupAlmaceneroUser();
