import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Producto } from '../entities/Producto.entity';

async function updateImages() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Producto);
  
  const updates = [
    { nombre: 'Mantequilla Gloria 200g', imagen: 'uploads/productos/mantequilla_gloria.jpg' },
    { nombre: 'Queso Edam Laive 250g', imagen: 'uploads/productos/queso_edam_laive.jpg' },
    { nombre: 'Leche Chocolatada Gloria 1L', imagen: 'uploads/productos/leche_chocolatada.jpg' },
    { nombre: 'Yogurt Griego Danlac 160g', imagen: 'uploads/productos/yogurt_griego_danlac.jpg' },
    { nombre: 'Leche Deslactosada Laive 1L', imagen: 'uploads/productos/leche_deslactosada.jpg' },
    { nombre: 'Queso Crema Philadelphia 210g', imagen: 'uploads/productos/queso_crema.jpg' },
  ];

  for (const u of updates) {
    const p = await repo.findOne({ where: { nombre: u.nombre }});
    if (p) {
      p.imagen = u.imagen;
      await repo.save(p);
    }
  }

  await AppDataSource.destroy();
}

updateImages();
