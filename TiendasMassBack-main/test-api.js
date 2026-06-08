#!/usr/bin/env node

/**
 * Script para verificar la conectividad con la API de Tabla Maestra
 * Uso: node test-api.js
 */

const API_URL = 'http://localhost:3001/api/master-table';

async function testAPI() {
  console.log('🧪 Iniciando pruebas de API...\n');

  try {
    // Test 1: Health check del servidor
    console.log('1️⃣  Verificando servidor backend...');
    const healthRes = await fetch('http://localhost:3001/health');
    const healthData = await healthRes.json();
    
    if (healthRes.ok) {
      console.log('✅ Backend está activo');
      console.log('   Status:', healthData.status);
      console.log('   Database:', healthData.database_connected ? 'Conectada ✓' : 'No conectada ✗');
    } else {
      console.log('❌ Backend no está respondiendo correctamente');
      return;
    }

    // Test 2: GET - Listar registros
    console.log('\n2️⃣  Obteniendo registros de Tabla Maestra...');
    const getRes = await fetch(API_URL);
    const getData = await getRes.json();
    
    if (getRes.ok) {
      console.log(`✅ Se obtuvieron ${getData.length} registros`);
      if (getData.length > 0) {
        console.log('   Primer registro:', {
          id: getData[0].id,
          name: getData[0].name,
          status: getData[0].status
        });
      }
    } else {
      console.log('❌ Error al obtener registros:', getData);
      return;
    }

    // Test 3: POST - Crear registro
    console.log('\n3️⃣  Creando nuevo registro...');
    const newRecord = {
      parentId: null,
      name: `Test_${Date.now()}`,
      description: 'Registro de prueba - puede ser eliminado',
      value: null,
      order: 999,
      additionalOne: null,
      additionalTwo: null,
      additionalThree: null,
      userNew: 'TEST_SCRIPT',
      status: 'A'
    };

    const postRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    
    const postData = await postRes.json();
    
    if (postRes.ok) {
      console.log('✅ Registro creado exitosamente');
      console.log('   ID:', postData.id);
      console.log('   Name:', postData.name);
      
      // Test 4: PUT - Actualizar registro
      console.log('\n4️⃣  Actualizando registro...');
      const updateData = { ...postData, description: 'Actualizado desde test script' };
      
      const putRes = await fetch(`${API_URL}/${postData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (putRes.ok) {
        console.log('✅ Registro actualizado exitosamente');
      } else {
        console.log('❌ Error al actualizar:', await putRes.json());
      }

      // Test 5: DELETE - Eliminar registro
      console.log('\n5️⃣  Eliminando registro...');
      const delRes = await fetch(`${API_URL}/${postData.id}`, {
        method: 'DELETE'
      });
      
      if (delRes.ok) {
        console.log('✅ Registro eliminado exitosamente');
      } else {
        console.log('❌ Error al eliminar:', await delRes.json());
      }

    } else {
      console.log('❌ Error al crear registro:', postData);
    }

    console.log('\n✨ Pruebas completadas correctamente!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Asegúrate que:');
    console.log('   1. El backend está corriendo en http://localhost:3001');
    console.log('   2. Ejecutaste: npm run dev (en TiendasMassBack-main)');
  }
}

testAPI();
