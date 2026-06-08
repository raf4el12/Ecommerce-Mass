/**
 * Seed idempotente: crea estados, roles, permisos, usuarios admin y data de catálogo.
 *
 * Uso:
 *   npm run seed
 *
 * Re-correrlo es seguro: cada upsert revisa si el registro ya existe antes de insertar.
 *
 * Credenciales creadas:
 *   - admin@tiendasmass.pe  / Admin123!   (Rol: Administrador, acceso total)
 *   - almacen@tiendasmass.pe / Admin123!  (Rol: Almacenero, READ catálogo + CRUD productos)
 *   - vendedor@tiendasmass.pe / Admin123! (Rol: Vendedor, READ catálogo + CRUD pedidos)
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { Estado } from '../entities/Estado.entity';
import { Rol } from '../entities/Rol.entity';
import {
  Permiso,
  AdminModulo,
  AdminAccion,
} from '../entities/Permiso.entity';
import { RolPermiso } from '../entities/RolPermiso.entity';
import { Usuario } from '../entities/Usuario.entity';
import { Categoria } from '../entities/Categoria.entity';
import { Subcategoria } from '../entities/Subcategoria.entity';
import { Producto } from '../entities/Producto.entity';
import { MetodoPago } from '../entities/MetodoPago.entity';
import { MetodoEnvio } from '../entities/MetodoEnvio.entity';
import { Tienda } from '../entities/Tienda.entity';

async function seedEstados() {
  const repo = AppDataSource.getRepository(Estado);
  const data = [
    { id: 1, nombre: 'Activo',    descripcion: 'Registro activo',           color: '#10b981', orden: 1, activo: true },
    { id: 2, nombre: 'Inactivo',  descripcion: 'Registro inactivo',         color: '#6b7280', orden: 2, activo: true },
    { id: 3, nombre: 'Pendiente', descripcion: 'Pendiente de aprobación',   color: '#f59e0b', orden: 3, activo: true },
    { id: 4, nombre: 'Suspendido', descripcion: 'Suspendido temporalmente', color: '#ef4444', orden: 4, activo: true },
  ];
  let created = 0;
  for (const e of data) {
    const exists = await repo.findOne({ where: { nombre: e.nombre } });
    if (!exists) {
      await repo.save(repo.create(e));
      created++;
    }
  }
  console.log(`  ✔ Estados: ${created} creados (${data.length} totales)`);
  return repo.find();
}

async function seedRoles() {
  const repo = AppDataSource.getRepository(Rol);
  const data = [
    { nombre: 'Administrador', descripcion: 'Acceso total al panel administrativo' },
    { nombre: 'Almacenero',    descripcion: 'Gestión de catálogo (productos, categorías)' },
    { nombre: 'Vendedor',      descripcion: 'Gestión de pedidos y atención al cliente' },
    { nombre: 'Cliente',       descripcion: 'Usuario final del e-commerce' },
  ];
  let created = 0;
  for (const r of data) {
    const exists = await repo.findOne({ where: { nombre: r.nombre } });
    if (!exists) {
      await repo.save(repo.create(r));
      created++;
    }
  }
  console.log(`  ✔ Roles: ${created} creados (${data.length} totales)`);
  return repo.find();
}

async function seedPermisos() {
  const repo = AppDataSource.getRepository(Permiso);
  let created = 0;
  for (const modulo of Object.values(AdminModulo)) {
    for (const accion of Object.values(AdminAccion)) {
      const exists = await repo.findOne({ where: { modulo, accion } });
      if (!exists) {
        await repo.save(repo.create({ modulo, accion }));
        created++;
      }
    }
  }
  const total = Object.values(AdminModulo).length * Object.values(AdminAccion).length;
  console.log(`  ✔ Permisos: ${created} creados (${total} totales)`);
}

async function seedRolPermisos() {
  const rolRepo = AppDataSource.getRepository(Rol);
  const permisoRepo = AppDataSource.getRepository(Permiso);
  const rpRepo = AppDataSource.getRepository(RolPermiso);

  // Mapa de permisos por rol (excepto Administrador — el controller le da todo por nombre)
  const matrix: Record<string, Array<{ modulo: AdminModulo; accion: AdminAccion }>> = {
    Almacenero: [
      { modulo: AdminModulo.DASHBOARD, accion: AdminAccion.READ },
      { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.READ },
      { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.CREATE },
      { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.UPDATE },
      { modulo: AdminModulo.CATEGORIAS, accion: AdminAccion.READ },
      { modulo: AdminModulo.SUBCATEGORIAS, accion: AdminAccion.READ },
      { modulo: AdminModulo.TIENDAS, accion: AdminAccion.READ },
      { modulo: AdminModulo.ESTADOS, accion: AdminAccion.READ },
    ],
    Vendedor: [
      { modulo: AdminModulo.DASHBOARD, accion: AdminAccion.READ },
      { modulo: AdminModulo.PRODUCTOS, accion: AdminAccion.READ },
      { modulo: AdminModulo.PEDIDOS, accion: AdminAccion.READ },
      { modulo: AdminModulo.PEDIDOS, accion: AdminAccion.CREATE },
      { modulo: AdminModulo.PEDIDOS, accion: AdminAccion.UPDATE },
      { modulo: AdminModulo.METODO_PAGO, accion: AdminAccion.READ },
      { modulo: AdminModulo.METODO_ENVIO, accion: AdminAccion.READ },
    ],
  };

  let created = 0;
  for (const [rolNombre, perms] of Object.entries(matrix)) {
    const rol = await rolRepo.findOne({ where: { nombre: rolNombre } });
    if (!rol) continue;
    for (const p of perms) {
      const permiso = await permisoRepo.findOne({ where: { modulo: p.modulo, accion: p.accion } });
      if (!permiso) continue;
      const exists = await rpRepo.findOne({ where: { rolId: rol.id, permisoId: permiso.id } });
      if (!exists) {
        await rpRepo.save(rpRepo.create({ rolId: rol.id, permisoId: permiso.id }));
        created++;
      }
    }
  }
  console.log(`  ✔ RolPermiso: ${created} asignaciones nuevas`);
}

async function seedUsuarios() {
  const userRepo = AppDataSource.getRepository(Usuario);
  const rolRepo = AppDataSource.getRepository(Rol);
  const estadoRepo = AppDataSource.getRepository(Estado);

  const activo = await estadoRepo.findOne({ where: { nombre: 'Activo' } });
  if (!activo) throw new Error('Estado "Activo" no encontrado — corre seedEstados primero');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const users = [
    {
      email: 'admin@tiendasmass.pe',
      nombre: 'Administrador General',
      rolNombre: 'Administrador',
      telefono: '999000001',
    },
    {
      email: 'almacen@tiendasmass.pe',
      nombre: 'Almacenero Demo',
      rolNombre: 'Almacenero',
      telefono: '999000002',
    },
    {
      email: 'vendedor@tiendasmass.pe',
      nombre: 'Vendedor Demo',
      rolNombre: 'Vendedor',
      telefono: '999000003',
    },
  ];

  let created = 0;
  for (const u of users) {
    const exists = await userRepo.findOne({ where: { email: u.email } });
    if (exists) continue;
    const rol = await rolRepo.findOne({ where: { nombre: u.rolNombre } });
    if (!rol) continue;
    await userRepo.save(
      userRepo.create({
        email: u.email,
        nombre: u.nombre,
        password: hashedPassword,
        telefono: u.telefono,
        ciudad: 'Lima',
        codigoPostal: '15001',
        direccion: 'Av. Principal 123',
        estado: activo,
        rol,
      })
    );
    created++;
  }
  console.log(`  ✔ Usuarios: ${created} creados (${users.length} totales)`);
}

async function seedCatalogo() {
  const estadoRepo = AppDataSource.getRepository(Estado);
  const catRepo = AppDataSource.getRepository(Categoria);
  const subRepo = AppDataSource.getRepository(Subcategoria);
  const prodRepo = AppDataSource.getRepository(Producto);

  const activo = await estadoRepo.findOne({ where: { nombre: 'Activo' } });
  if (!activo) throw new Error('Estado Activo no existe');

  const categoriasData = [
    { nombre: 'Lácteos',     descripcion: 'Leche, yogurt, quesos y derivados' },
    { nombre: 'Embutidos',   descripcion: 'Jamón, salchichas, chorizo' },
    { nombre: 'Abarrotes',   descripcion: 'Arroz, fideos, aceite, conservas' },
    { nombre: 'Bebidas',     descripcion: 'Gaseosas, jugos, agua, refrescos' },
    { nombre: 'Limpieza',    descripcion: 'Detergentes, jabones, lavavajilla' },
  ];

  const subcategoriasData: Record<string, string[]> = {
    Lácteos: ['Leche', 'Yogurt', 'Queso', 'Mantequilla'],
    Embutidos: ['Jamón', 'Salchicha', 'Chorizo'],
    Abarrotes: ['Arroz', 'Fideos', 'Aceite', 'Conservas', 'Azúcar'],
    Bebidas: ['Gaseosas', 'Jugos', 'Agua', 'Cervezas'],
    Limpieza: ['Detergente', 'Jabón', 'Lavavajilla'],
  };

  let catCreadas = 0;
  let subCreadas = 0;

  for (const c of categoriasData) {
    let categoria = await catRepo.findOne({ where: { nombre: c.nombre } });
    if (!categoria) {
      categoria = await catRepo.save(catRepo.create({ ...c, estado: activo }));
      catCreadas++;
    }
    for (const subNombre of subcategoriasData[c.nombre] || []) {
      const exists = await subRepo.findOne({
        where: { nombre: subNombre, categoria: { id: categoria.id } },
        relations: ['categoria'],
      });
      if (!exists) {
        await subRepo.save(
          subRepo.create({
            nombre: subNombre,
            descripcion: `${subNombre} - ${c.nombre}`,
            categoria,
            estado: activo,
          })
        );
        subCreadas++;
      }
    }
  }
  console.log(`  ✔ Categorías: ${catCreadas} creadas / Subcategorías: ${subCreadas} creadas`);

  // Productos demo
  const productosData = [
    { nombre: 'Leche Gloria Entera 1L',   precio: 4.50,  stock: 124, marca: 'Gloria',       categoria: 'Lácteos',   imagen: 'uploads/productos/leche_entera.jpg' },
    { nombre: 'Yogurt Laive Fresa 1L',   precio: 6.90,  stock: 80,  marca: 'Laive',        categoria: 'Lácteos' },
    { nombre: 'Queso Fresco Bonle 500g', precio: 12.50, stock: 45,  marca: 'Bonle',        categoria: 'Lácteos',   imagen: 'uploads/productos/queso_fresco.jpg' },
    { nombre: 'Jamón San Fernando 200g', precio: 8.90,  stock: 12,  marca: 'San Fernando', categoria: 'Embutidos' },
    { nombre: 'Salchicha Otto Kunz 8u',  precio: 7.50,  stock: 60,  marca: 'Otto Kunz',    categoria: 'Embutidos' },
    { nombre: 'Arroz Costeño 5kg',       precio: 18.90, stock: 200, marca: 'Costeño',      categoria: 'Abarrotes' },
    { nombre: 'Fideo Don Vittorio 500g', precio: 3.20,  stock: 150, marca: 'Don Vittorio', categoria: 'Abarrotes' },
    { nombre: 'Aceite Primor 1L',        precio: 9.50,  stock: 34,  marca: 'Primor',       categoria: 'Abarrotes',   imagen: 'uploads/productos/aceite_girasol.jpg' },
    { nombre: 'Inca Kola 1.5L',          precio: 6.00,  stock: 95,  marca: 'Inca Kola',    categoria: 'Bebidas' },
    { nombre: 'Agua San Mateo 2.5L',     precio: 4.20,  stock: 110, marca: 'San Mateo',    categoria: 'Bebidas' },
    { nombre: 'Detergente Bolívar 4.5kg', precio: 29.90, stock: 18,  marca: 'Bolívar',     categoria: 'Limpieza', imagen: 'uploads/productos/detergente_ariel.jpg' },
    { nombre: 'Jabón Bolívar Pack 5',     precio: 12.90, stock: 70,  marca: 'Bolívar',     categoria: 'Limpieza', imagen: 'uploads/productos/jabon_dove.jpg' },
  ];

  let prodCreados = 0;
  for (const p of productosData) {
    const exists = await prodRepo.findOne({ where: { nombre: p.nombre } });
    if (exists) continue;
    const categoria = await catRepo.findOne({ where: { nombre: p.categoria } });
    if (!categoria) continue;
    await prodRepo.save(
      prodRepo.create({
        nombre: p.nombre,
        descripcion: `${p.nombre} — marca ${p.marca}`,
        precio: p.precio,
        stock: p.stock,
        marca: p.marca,
        imagen: p.imagen || '',
        categoria,
        estado: activo,
      })
    );
    prodCreados++;
  }
  console.log(`  ✔ Productos: ${prodCreados} creados (${productosData.length} totales)`);
}

async function seedMetodosPago() {
  const repo = AppDataSource.getRepository(MetodoPago);
  const data = [
    { nombre: 'Tarjeta',      tipo: 'tarjeta',      comision: 3.5, descripcion: 'Visa, Mastercard, Amex' },
    { nombre: 'Yape',         tipo: 'billetera',    comision: 0,   descripcion: 'Pago con Yape' },
    { nombre: 'Plin',         tipo: 'billetera',    comision: 0,   descripcion: 'Pago con Plin' },
    { nombre: 'Efectivo',     tipo: 'efectivo',     comision: 0,   descripcion: 'Pago contra entrega' },
    { nombre: 'Transferencia', tipo: 'transferencia', comision: 0, descripcion: 'Transferencia bancaria' },
  ];
  let created = 0;
  for (const m of data) {
    const exists = await repo.findOne({ where: { nombre: m.nombre } });
    if (!exists) {
      await repo.save(repo.create(m));
      created++;
    }
  }
  console.log(`  ✔ MetodoPago: ${created} creados (${data.length} totales)`);
}

async function seedMetodosEnvio() {
  const repo = AppDataSource.getRepository(MetodoEnvio);
  const data = [
    { nombre: 'Recojo en tienda', descripcion: 'Sin costo. Recoge en la tienda más cercana.', precio: 0 },
    { nombre: 'Delivery Express',  descripcion: 'Entrega en 90 min en Lima Metropolitana.',   precio: 9.90 },
    { nombre: 'Delivery Standard', descripcion: 'Entrega en 24 horas.',                       precio: 5.90 },
  ];
  let created = 0;
  for (const m of data) {
    const exists = await repo.findOne({ where: { nombre: m.nombre } });
    if (!exists) {
      await repo.save(repo.create(m));
      created++;
    }
  }
  console.log(`  ✔ MetodoEnvio: ${created} creados (${data.length} totales)`);
}

async function seedTiendas() {
  const repo = AppDataSource.getRepository(Tienda);
  const data = [
    { nombre: 'Mass San Isidro',      direccion: 'Av. Javier Prado Este 1234, San Isidro',    telefono: '014567890', activo: true },
    { nombre: 'Mass Miraflores',      direccion: 'Av. Larco 789, Miraflores',                 telefono: '014567891', activo: true },
    { nombre: 'Mass Surco',           direccion: 'Av. Primavera 456, Santiago de Surco',      telefono: '014567892', activo: true },
    { nombre: 'Mass Los Olivos',      direccion: 'Av. Universitaria 2345, Los Olivos',        telefono: '014567893', activo: true },
  ];
  let created = 0;
  for (const t of data) {
    const exists = await repo.findOne({ where: { nombre: t.nombre } });
    if (!exists) {
      await repo.save(repo.create(t));
      created++;
    }
  }
  console.log(`  ✔ Tiendas: ${created} creadas (${data.length} totales)`);
}

async function main() {
  console.log('🌱 Iniciando seed…\n');
  await AppDataSource.initialize();
  console.log('✓ Conexión a BD establecida\n');

  console.log('▶ Estados, Roles, Permisos:');
  await seedEstados();
  await seedRoles();
  await seedPermisos();
  await seedRolPermisos();

  console.log('\n▶ Usuarios admin:');
  await seedUsuarios();

  console.log('\n▶ Catálogo (Categorías, Subcategorías, Productos):');
  await seedCatalogo();

  console.log('\n▶ Métodos de pago y envío:');
  await seedMetodosPago();
  await seedMetodosEnvio();

  console.log('\n▶ Tiendas:');
  await seedTiendas();

  console.log('\n✅ Seed completado.\n');
  console.log('Credenciales para login:');
  console.log('  👤 admin@tiendasmass.pe    / Admin123!  (Administrador — acceso total)');
  console.log('  👤 almacen@tiendasmass.pe  / Admin123!  (Almacenero)');
  console.log('  👤 vendedor@tiendasmass.pe / Admin123!  (Vendedor)\n');

  await AppDataSource.destroy();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('\n❌ Error en seed:', err);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
