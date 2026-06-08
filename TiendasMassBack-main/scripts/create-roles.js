const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Jake170702',
  database: 'tiendasmass'
};

async function createRoles() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Verificar roles existentes
    const [roles] = await connection.query('SELECT * FROM Rol');
    console.log('Roles actuales:');
    console.table(roles);

    // Crear roles necesarios si no existen
    const rolesNeeded = [
      { id: 1, nombre: 'administrador' },
      { id: 2, nombre: 'cliente' },
      { id: 3, nombre: 'vendedor' }
    ];

    for (const rol of rolesNeeded) {
      const [exists] = await connection.query('SELECT * FROM Rol WHERE id = ?', [rol.id]);
      if (exists.length === 0) {
        await connection.query('INSERT INTO Rol (id, nombre) VALUES (?, ?)', [rol.id, rol.nombre]);
        console.log(`✓ Rol creado: ID ${rol.id} - ${rol.nombre}`);
      } else {
        console.log(`✓ Rol ya existe: ID ${rol.id} - ${rol.nombre}`);
      }
    }

    // Mostrar roles finales
    const [finalRoles] = await connection.query('SELECT * FROM Rol');
    console.log('\n--- Roles finales en la base de datos ---');
    console.table(finalRoles);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

createRoles();
