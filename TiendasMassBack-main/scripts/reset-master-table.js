#!/usr/bin/env node

/**
 * Script para limpiar y reinicializar MasterTable con IDs jerárquicos correctos
 * Uso: node scripts/reset-master-table.js
 */

const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Jake170702',
  database: 'tiendasmass',
};

async function resetMasterTable() {
  let connection;
  try {
    console.log('🔌 Conectando a la base de datos...\n');
    connection = await mysql.createConnection(config);

    console.log('� Deshabilitando restricciones de clave foránea...');
    await connection.execute('SET FOREIGN_KEY_CHECKS=0');
    console.log('✅ Restricciones deshabilitadas\n');

    console.log('🗑️  Limpiando tabla MasterTable...');
    await connection.execute('DELETE FROM MasterTable');
    await connection.execute('ALTER TABLE MasterTable AUTO_INCREMENT=1');
    console.log('✅ Tabla limpiada\n');

    console.log('🔒 Rehabilitando restricciones de clave foránea...');
    await connection.execute('SET FOREIGN_KEY_CHECKS=1');
    console.log('✅ Restricciones rehabilitadas\n');

    console.log('📝 Insertando datos de ejemplo con IDs jerárquicos...\n');

    // Padre 1: Género (ID 100)
    await connection.execute(
      `INSERT INTO MasterTable (idMasterTable, idMasterTableParent, name, description, value, \`order\`, additionalOne, additionalTwo, additionalThree, userNew, status) 
       VALUES (100, NULL, 'Genero', 'Sexo del colaborador', NULL, 0, NULL, NULL, NULL, 'ADMIN', 'A')`
    );
    console.log('✅ ID 100 - Género (padre)');

    // Hijos de Género
    await connection.execute(
      `INSERT INTO MasterTable (idMasterTable, idMasterTableParent, name, description, value, \`order\`, additionalOne, additionalTwo, additionalThree, userNew, status) 
       VALUES (101, 100, 'Masculino', 'Sexo masculino', 'M', 1, NULL, NULL, NULL, 'ADMIN', 'A')`
    );
    console.log('✅ ID 101 - Masculino (hijo de 100)');

    await connection.execute(
      `INSERT INTO MasterTable (idMasterTable, idMasterTableParent, name, description, value, \`order\`, additionalOne, additionalTwo, additionalThree, userNew, status) 
       VALUES (102, 100, 'Femenino', 'Sexo femenino', 'F', 2, NULL, NULL, NULL, 'ADMIN', 'A')`
    );
    console.log('✅ ID 102 - Femenino (hijo de 100)');

    // Padre 2: Tipo Documento (ID 200)
    await connection.execute(
      `INSERT INTO MasterTable (idMasterTable, idMasterTableParent, name, description, value, \`order\`, additionalOne, additionalTwo, additionalThree, userNew, status) 
       VALUES (200, NULL, 'tipoDocumento', 'Tipo de documento', NULL, 0, NULL, NULL, NULL, 'ADMIN', 'A')`
    );
    console.log('✅ ID 200 - tipoDocumento (padre)');

    // Hijos de Tipo Documento
    await connection.execute(
      `INSERT INTO MasterTable (idMasterTable, idMasterTableParent, name, description, value, \`order\`, additionalOne, additionalTwo, additionalThree, userNew, status) 
       VALUES (201, 200, 'DNI', 'Documento Nacional de Identidad', 'DNI', 1, NULL, NULL, NULL, 'ADMIN', 'A')`
    );
    console.log('✅ ID 201 - DNI (hijo de 200)');

    await connection.execute(
      `INSERT INTO MasterTable (idMasterTable, idMasterTableParent, name, description, value, \`order\`, additionalOne, additionalTwo, additionalThree, userNew, status) 
       VALUES (202, 200, 'Pasaporte', 'Pasaporte Internacional', 'PT', 2, NULL, NULL, NULL, 'ADMIN', 'A')`
    );
    console.log('✅ ID 202 - Pasaporte (hijo de 200)');

    console.log('\n✨ Reinicialización completada correctamente!\n');
    console.log('📊 Estructura:');
    console.log('   100 (Género)');
    console.log('   ├─ 101 (Masculino)');
    console.log('   └─ 102 (Femenino)');
    console.log('   200 (tipoDocumento)');
    console.log('   ├─ 201 (DNI)');
    console.log('   └─ 202 (Pasaporte)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetMasterTable();
