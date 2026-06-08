import { AppDataSource } from "../config/data-source";
import { Subcategoria } from "../entities/Subcategoria.entity";
import { Categoria } from "../entities/Categoria.entity";

export class SubcategoriaService {
  private subcategoryRepository = AppDataSource.getRepository(Subcategoria);
  private categoryRepository = AppDataSource.getRepository(Categoria);

  /**
   * Obtener todas las subcategorías
   */
  async getAllSubcategories() {
    return await this.subcategoryRepository.find({
      relations: ["estado", "categoria", "productos"],
    });
  }

  /**
   * Obtener subcategorías por categoría
   */
  async getSubcategoriesByCategory(categoriaId: number) {
    return await this.subcategoryRepository.find({
      where: { categoria: { id: categoriaId } },
      relations: ["estado", "categoria", "productos"],
    });
  }

  /**
   * Obtener subcategoría por ID
   */
  async getSubcategoryById(id: number) {
    return await this.subcategoryRepository.findOne({
      where: { id },
      relations: ["estado", "categoria", "productos"],
    });
  }

  /**
   * Crear nueva subcategoría
   */
  async createSubcategory(data: {
    nombre: string;
    descripcion?: string;
    categoriaId: number;
    estado?: number;
  }) {
    // Validar que la categoría existe
    const category = await this.categoryRepository.findOne({
      where: { id: data.categoriaId },
    });

    if (!category) {
      throw new Error("Categoría no encontrada");
    }

    // Verificar duplicado
    const existing = await this.subcategoryRepository.findOne({
      where: {
        nombre: data.nombre.trim(),
        categoria: { id: data.categoriaId },
      },
    });

    if (existing) {
      throw new Error(
        "Ya existe una subcategoría con ese nombre en esta categoría"
      );
    }

    const subcategoryData = {
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || '',
      categoria: { id: data.categoriaId },
      estado: { id: data.estado || 1 },
    };

    const subcategory = this.subcategoryRepository.create(subcategoryData as any);
    return await this.subcategoryRepository.save(subcategory);
  }

  /**
   * Actualizar subcategoría
   */
  async updateSubcategory(
    id: number,
    data: { nombre?: string; descripcion?: string; estado?: number }
  ) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ["estado", "categoria", "productos"],
    });

    if (!subcategory) {
      throw new Error("Subcategoría no encontrada");
    }

    if (data.nombre) subcategory.nombre = data.nombre.trim();
    if (data.descripcion !== undefined)
      subcategory.descripcion = data.descripcion?.trim() || '';
    if (data.estado) subcategory.estado = { id: data.estado } as any;

    return await this.subcategoryRepository.save(subcategory);
  }

  /**
   * Eliminar subcategoría
   */
  async deleteSubcategory(id: number) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
    });

    if (!subcategory) {
      throw new Error("Subcategoría no encontrada");
    }

    await this.subcategoryRepository.remove(subcategory);
  }

  /**
   * Obtener subcategorías activas
   */
  async getActiveSubcategories() {
    return await this.subcategoryRepository.find({
      where: { estado: { id: 1 } }, // Asumiendo que 1 es activo
      relations: ["estado", "categoria", "productos"],
    });
  }

  /**
   * Obtener subcategorías activas por categoría
   */
  async getActiveSubcategoriesByCategory(categoriaId: number) {
    return await this.subcategoryRepository.find({
      where: {
        categoria: { id: categoriaId },
        estado: { id: 1 }, // Asumiendo que 1 es activo
      },
      relations: ["estado", "categoria", "productos"],
    });
  }
}
