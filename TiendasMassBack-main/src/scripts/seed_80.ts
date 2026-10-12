import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Categoria } from '../entities/Categoria.entity';
import { Producto } from '../entities/Producto.entity';
import { Estado } from '../entities/Estado.entity';

const newProducts = [
  // 1. Lácteos
  { nombre: 'Mantequilla Gloria 200g', precio: 7.5, stock: 50, marca: 'Gloria', categoria: 'Lácteos' },
  { nombre: 'Queso Edam Laive 250g', precio: 15.0, stock: 40, marca: 'Laive', categoria: 'Lácteos' },
  { nombre: 'Leche Chocolatada Gloria 1L', precio: 5.5, stock: 80, marca: 'Gloria', categoria: 'Lácteos' },
  { nombre: 'Yogurt Griego Danlac 160g', precio: 4.9, stock: 60, marca: 'Danlac', categoria: 'Lácteos' },
  { nombre: 'Leche Deslactosada Laive 1L', precio: 5.2, stock: 90, marca: 'Laive', categoria: 'Lácteos' },
  { nombre: 'Queso Crema Philadelphia 210g', precio: 12.9, stock: 30, marca: 'Philadelphia', categoria: 'Lácteos' },
  { nombre: 'Manjar Blanco Nestlé 400g', precio: 9.5, stock: 45, marca: 'Nestlé', categoria: 'Lácteos' },
  { nombre: 'Yogurt Vainilla Gloria 1L', precio: 6.5, stock: 70, marca: 'Gloria', categoria: 'Lácteos' },
  { nombre: 'Margarina Manty 250g', precio: 4.2, stock: 100, marca: 'Manty', categoria: 'Lácteos' },
  { nombre: 'Queso Fresco Light Bonle 250g', precio: 7.9, stock: 55, marca: 'Bonle', categoria: 'Lácteos' },

  // 2. Embutidos
  { nombre: 'Hot Dog San Fernando 500g', precio: 12.0, stock: 60, marca: 'San Fernando', categoria: 'Embutidos' },
  { nombre: 'Jamón Inglés Braedt 200g', precio: 15.5, stock: 40, marca: 'Braedt', categoria: 'Embutidos' },
  { nombre: 'Tocino Ahumado Otto Kunz 200g', precio: 18.9, stock: 35, marca: 'Otto Kunz', categoria: 'Embutidos' },
  { nombre: 'Salame Cerdeña 100g', precio: 9.9, stock: 50, marca: 'Cerdeña', categoria: 'Embutidos' },
  { nombre: 'Chorizo Parrillero San Fernando 500g', precio: 16.5, stock: 45, marca: 'San Fernando', categoria: 'Embutidos' },
  { nombre: 'Jamón de Pavita San Fernando 250g', precio: 14.5, stock: 55, marca: 'San Fernando', categoria: 'Embutidos' },
  { nombre: 'Salchicha Huachana 250g', precio: 10.0, stock: 65, marca: 'San Fernando', categoria: 'Embutidos' },
  { nombre: 'Morcilla Otto Kunz 300g', precio: 13.9, stock: 30, marca: 'Otto Kunz', categoria: 'Embutidos' },
  { nombre: 'Prosciutto Braedt 100g', precio: 22.0, stock: 20, marca: 'Braedt', categoria: 'Embutidos' },
  { nombre: 'Cabanozi Cerdeña 150g', precio: 11.5, stock: 40, marca: 'Cerdeña', categoria: 'Embutidos' },

  // 3. Abarrotes
  { nombre: 'Fideos Spaghetti Don Vittorio 1kg', precio: 6.0, stock: 120, marca: 'Don Vittorio', categoria: 'Abarrotes' },
  { nombre: 'Arroz Faraón 5kg', precio: 22.5, stock: 80, marca: 'Faraón', categoria: 'Abarrotes' },
  { nombre: 'Aceite de Oliva Huerto Alamein 500ml', precio: 28.0, stock: 30, marca: 'Huerto Alamein', categoria: 'Abarrotes' },
  { nombre: 'Avena Quaker 500g', precio: 5.5, stock: 90, marca: 'Quaker', categoria: 'Abarrotes' },
  { nombre: 'Café Altomayo 200g', precio: 15.9, stock: 50, marca: 'Altomayo', categoria: 'Abarrotes' },
  { nombre: 'Lentejas Costeño 500g', precio: 4.8, stock: 75, marca: 'Costeño', categoria: 'Abarrotes' },
  { nombre: 'Salsa de Tomate Pomarola 250g', precio: 2.5, stock: 150, marca: 'Pomarola', categoria: 'Abarrotes' },
  { nombre: 'Sal de Maras Emsal 1kg', precio: 3.2, stock: 110, marca: 'Emsal', categoria: 'Abarrotes' },
  { nombre: 'Mayonesa Alacena 500cc', precio: 8.9, stock: 85, marca: 'Alacena', categoria: 'Abarrotes' },
  { nombre: 'Atún Campomar 170g', precio: 5.2, stock: 130, marca: 'Campomar', categoria: 'Abarrotes' },

  // 4. Bebidas
  { nombre: 'Agua Cielo 2.5L', precio: 3.5, stock: 150, marca: 'Cielo', categoria: 'Bebidas' },
  { nombre: 'Gaseosa Sprite 3L', precio: 10.5, stock: 90, marca: 'Sprite', categoria: 'Bebidas' },
  { nombre: 'Cerveza Cusqueña Trigo 620ml', precio: 6.5, stock: 100, marca: 'Cusqueña', categoria: 'Bebidas' },
  { nombre: 'Jugo Frugos Durazno 1L', precio: 4.9, stock: 70, marca: 'Frugos', categoria: 'Bebidas' },
  { nombre: 'Energizante Red Bull 250ml', precio: 7.9, stock: 85, marca: 'Red Bull', categoria: 'Bebidas' },
  { nombre: 'Gatorade Naranja 500ml', precio: 3.5, stock: 120, marca: 'Gatorade', categoria: 'Bebidas' },
  { nombre: 'Vino Tinto Tabernero 750ml', precio: 25.0, stock: 40, marca: 'Tabernero', categoria: 'Bebidas' },
  { nombre: 'Pisco Queirolo Acholado 750ml', precio: 35.0, stock: 35, marca: 'Santiago Queirolo', categoria: 'Bebidas' },
  { nombre: 'Agua San Luis con Gas 2.5L', precio: 4.0, stock: 80, marca: 'San Luis', categoria: 'Bebidas' },
  { nombre: 'Té Lipton Limón 500ml', precio: 2.5, stock: 95, marca: 'Lipton', categoria: 'Bebidas' },

  // 5. Limpieza
  { nombre: 'Suavizante Downy 800ml', precio: 9.5, stock: 65, marca: 'Downy', categoria: 'Limpieza' },
  { nombre: 'Lejía Clorox 1kg', precio: 3.9, stock: 110, marca: 'Clorox', categoria: 'Limpieza' },
  { nombre: 'Detergente Opal 2.5kg', precio: 18.5, stock: 45, marca: 'Opal', categoria: 'Limpieza' },
  { nombre: 'Papel Higiénico Suave 12 rollos', precio: 14.9, stock: 80, marca: 'Suave', categoria: 'Limpieza' },
  { nombre: 'Bolsas de Basura Virutex 10u', precio: 5.5, stock: 70, marca: 'Virutex', categoria: 'Limpieza' },
  { nombre: 'Limpiavidrios Sapolio 500ml', precio: 4.2, stock: 55, marca: 'Sapolio', categoria: 'Limpieza' },
  { nombre: 'Desinfectante Pino Rey 1L', precio: 6.9, stock: 60, marca: 'Pino Rey', categoria: 'Limpieza' },
  { nombre: 'Esponja Scotch Brite 3u', precio: 4.5, stock: 90, marca: 'Scotch Brite', categoria: 'Limpieza' },
  { nombre: 'Lavavajilla Sapolio Limón 350g', precio: 3.2, stock: 100, marca: 'Sapolio', categoria: 'Limpieza' },
  { nombre: 'Ambientador Glade 360ml', precio: 11.5, stock: 40, marca: 'Glade', categoria: 'Limpieza' },

  // 6. Panadería
  { nombre: 'Pan de Molde Blanco Bimbo 500g', precio: 8.5, stock: 50, marca: 'Bimbo', categoria: 'Panadería' },
  { nombre: 'Tostadas Integrales Unión 200g', precio: 4.5, stock: 60, marca: 'Unión', categoria: 'Panadería' },
  { nombre: 'Keke de Vainilla Bimbo 250g', precio: 6.5, stock: 45, marca: 'Bimbo', categoria: 'Panadería' },
  { nombre: 'Tortillas de Trigo Bimbo 10u', precio: 7.9, stock: 55, marca: 'Bimbo', categoria: 'Panadería' },
  { nombre: 'Panetón DOnofrio 900g', precio: 25.0, stock: 30, marca: 'DOnofrio', categoria: 'Panadería' },
  { nombre: 'Pan Hamburguesa Bimbo 6u', precio: 6.2, stock: 65, marca: 'Bimbo', categoria: 'Panadería' },
  { nombre: 'Pionono Unión 300g', precio: 8.9, stock: 40, marca: 'Unión', categoria: 'Panadería' },
  { nombre: 'Pan Hot Dog Bimbo 6u', precio: 5.9, stock: 70, marca: 'Bimbo', categoria: 'Panadería' },
  { nombre: 'Grisinos Unión 150g', precio: 3.5, stock: 80, marca: 'Unión', categoria: 'Panadería' },
  { nombre: 'Alfajores Havanna 6u', precio: 18.0, stock: 25, marca: 'Havanna', categoria: 'Panadería' },

  // 7. Cuidado Personal
  { nombre: 'Jabón Protex Avena 3u', precio: 8.5, stock: 70, marca: 'Protex', categoria: 'Cuidado Personal' },
  { nombre: 'Shampoo Pantene Restauración 400ml', precio: 19.9, stock: 45, marca: 'Pantene', categoria: 'Cuidado Personal' },
  { nombre: 'Acondicionador Sedal 340ml', precio: 14.5, stock: 50, marca: 'Sedal', categoria: 'Cuidado Personal' },
  { nombre: 'Desodorante Old Spice 50ml', precio: 12.5, stock: 60, marca: 'Old Spice', categoria: 'Cuidado Personal' },
  { nombre: 'Pasta Dental Oral-B 90g', precio: 5.5, stock: 85, marca: 'Oral-B', categoria: 'Cuidado Personal' },
  { nombre: 'Enjuague Bucal Listerine 500ml', precio: 18.9, stock: 40, marca: 'Listerine', categoria: 'Cuidado Personal' },
  { nombre: 'Crema Corporal Nivea 400ml', precio: 22.0, stock: 35, marca: 'Nivea', categoria: 'Cuidado Personal' },
  { nombre: 'Máquina de Afeitar Gillette 3u', precio: 15.0, stock: 55, marca: 'Gillette', categoria: 'Cuidado Personal' },
  { nombre: 'Toallas Higiénicas Nosotras 10u', precio: 6.9, stock: 75, marca: 'Nosotras', categoria: 'Cuidado Personal' },
  { nombre: 'Papel Toalla Elite 2u', precio: 7.5, stock: 65, marca: 'Elite', categoria: 'Cuidado Personal' },

  // 8. Snacks y Dulces
  { nombre: 'Doritos Nacho 150g', precio: 6.5, stock: 80, marca: 'Doritos', categoria: 'Snacks y Dulces' },
  { nombre: 'Cheetos Queso 150g', precio: 5.9, stock: 85, marca: 'Cheetos', categoria: 'Snacks y Dulces' },
  { nombre: 'Galletas Oreo 6x36g', precio: 4.5, stock: 100, marca: 'Oreo', categoria: 'Snacks y Dulces' },
  { nombre: 'Chocolate Princesa 50g', precio: 2.5, stock: 120, marca: 'Princesa', categoria: 'Snacks y Dulces' },
  { nombre: 'Wafer Costa Vainilla 120g', precio: 3.5, stock: 90, marca: 'Costa', categoria: 'Snacks y Dulces' },
  { nombre: 'Pringles Original 124g', precio: 12.9, stock: 40, marca: 'Pringles', categoria: 'Snacks y Dulces' },
  { nombre: 'Chicles Trident Menta 18u', precio: 4.0, stock: 150, marca: 'Trident', categoria: 'Snacks y Dulces' },
  { nombre: 'Marshmallows Fini 250g', precio: 7.5, stock: 60, marca: 'Fini', categoria: 'Snacks y Dulces' },
  { nombre: 'Chocman Costa 6u', precio: 6.0, stock: 70, marca: 'Costa', categoria: 'Snacks y Dulces' },
  { nombre: 'Galletas Ritz 6x34g', precio: 3.8, stock: 110, marca: 'Ritz', categoria: 'Snacks y Dulces' },
];

async function seedMassive() {
  console.log('🌱 Iniciando seed masivo (80 productos)...');
  await AppDataSource.initialize();

  const estadoRepo = AppDataSource.getRepository(Estado);
  const catRepo = AppDataSource.getRepository(Categoria);
  const prodRepo = AppDataSource.getRepository(Producto);

  const activo = await estadoRepo.findOne({ where: { nombre: 'Activo' } });
  if (!activo) throw new Error('Estado Activo no existe');

  let prodCreados = 0;

  for (const p of newProducts) {
    const exists = await prodRepo.findOne({ where: { nombre: p.nombre } });
    if (exists) continue;

    const categoria = await catRepo.findOne({ where: { nombre: p.categoria } });
    if (!categoria) {
      console.warn(`Categoría ${p.categoria} no encontrada para ${p.nombre}`);
      continue;
    }

    // Use placehold.co for image placeholder
    const imageText = encodeURIComponent(p.nombre);
    const imagen = `https://placehold.co/600x600/f8f9fa/1a1a1a.png?text=${imageText}`;

    await prodRepo.save(
      prodRepo.create({
        nombre: p.nombre,
        descripcion: `${p.nombre} — marca ${p.marca}`,
        precio: p.precio,
        stock: p.stock,
        marca: p.marca,
        imagen: imagen,
        categoria,
        estado: activo,
      })
    );
    prodCreados++;
  }

  console.log(`✅ ${prodCreados} nuevos productos creados con imágenes (placeholders).`);
  await AppDataSource.destroy();
}

seedMassive().catch(async (err) => {
  console.error('\n❌ Error en seed masivo:', err);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
