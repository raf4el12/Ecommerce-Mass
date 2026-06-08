const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Jake170702',
  database: 'tiendasmass'
};

// Métodos de pago a crear
const metodosPago = [
  {
    nombre: 'Tarjeta de Crédito',
    descripcion: 'Paga con tu tarjeta de crédito de forma segura',
    comision: 3.99,
    logo: null
  },
  {
    nombre: 'Tarjeta de Débito',
    descripcion: 'Paga directamente desde tu cuenta bancaria',
    comision: 2.99,
    logo: null
  },
  {
    nombre: 'Mercado Pago',
    descripcion: 'Pago seguro a través de Mercado Pago',
    comision: 2.49,
    logo: 'https://www.mercadopago.com/org-img/MP3/home/logo.svg'
  },
  {
    nombre: 'Transferencia Bancaria',
    descripcion: 'Realiza una transferencia bancaria directa',
    comision: 0,
    logo: null
  },
  {
    nombre: 'Billetera Digital',
    descripcion: 'Paga usando tu billetera digital',
    comision: 1.99,
    logo: null
  }
];

async function seedMetodosPago() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🔧 Iniciando seeding de métodos de pago...\n');

    let metodosCreados = 0;
    let metodosExistentes = 0;

    for (const metodo of metodosPago) {
      const [exists] = await connection.query(
        'SELECT id FROM MetodoPago WHERE nombre = ?',
        [metodo.nombre]
      );

      if (exists.length === 0) {
        await connection.query(
          'INSERT INTO MetodoPago (nombre, descripcion, comision, logo) VALUES (?, ?, ?, ?)',
          [metodo.nombre, metodo.descripcion, metodo.comision, metodo.logo]
        );
        console.log(`✓ Creado: ${metodo.nombre}`);
        metodosCreados++;
      } else {
        console.log(`⊘ Ya existe: ${metodo.nombre}`);
        metodosExistentes++;
      }
    }

    console.log(`\n✓ Métodos de pago creados: ${metodosCreados}`);
    console.log(`⊘ Métodos existentes: ${metodosExistentes}`);
    console.log('\n✅ ¡Seeding completado!\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error durante seeding:', error);
    await connection.end();
    process.exit(1);
  }
}

seedMetodosPago();
