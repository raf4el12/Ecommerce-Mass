import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source"; // Ajusta la ruta según tu configuración
import { Categoria } from "../entities/Categoria.entity"; // Ajusta la ruta según tu estructura

export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Verificar que la conexión existe
    if (!AppDataSource.isInitialized) {
      res
        .status(503)
        .json({ message: "La base de datos no está inicializada" });
      return;
    }

    const categoryRepository = AppDataSource.getRepository(Categoria);

    // Cargar categorías con relaciones estado y productos
    const categories = await categoryRepository.find({
      relations: ["estado", "productos"]
    });

    console.log("✅ Categorías encontradas:", categories.length);
    res.json(categories);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ Error al obtener categorías:", errorMessage);
    res.status(500).json({
      message: "Error al obtener las categorías",
      error: errorMessage,
    });
  }
};

// Opcional: Otros métodos CRUD que podrías necesitar
export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryRepository = AppDataSource.getRepository(Categoria);
    const category = await categoryRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["productos"], // Incluye los productos relacionados si los necesitas
    });

    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    res.json(category);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ message: errorMessage });
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { nombre, descripcion, estado } = req.body;

    // ✅ Validar que el nombre esté presente
    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ message: 'El nombre de la categoría es requerido' });
      return;
    }

    const categoryRepository = AppDataSource.getRepository(Categoria);

    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategory = await categoryRepository.findOne({
      where: { nombre: nombre.trim() }
    });

    if (existingCategory) {
      res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
      return;
    }

    // Crear la categoría - estado es opcional
    const categoryData: any = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
    };

    // Solo agregar estado si se proporciona y es un número válido
    // Si no se proporciona, usar estado Activo (ID 1) por defecto
    if (estado && !isNaN(parseInt(estado))) {
      categoryData.estado = { id: parseInt(estado) };
    } else {
      // Estado por defecto: Activo (ID 1)
      categoryData.estado = { id: 1 };
    }

    const newCategory = categoryRepository.create(categoryData);

    const savedCategory: Categoria = await categoryRepository.save(newCategory) as unknown as Categoria;

    // Recargar con relaciones
    const categoryWithRelations = await categoryRepository.findOne({
      where: { id: savedCategory.id },
      relations: ["productos", "estado"],
    });

    res.status(201).json(categoryWithRelations);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error('❌ Error al crear categoría:', errorMessage);
    res.status(500).json({ message: errorMessage });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;
    const categoryRepository = AppDataSource.getRepository(Categoria);

    const category = await categoryRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["productos", "estado"],
    });

    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    // Actualizar nombre si se proporciona
    if (nombre !== undefined && nombre !== null) {
      category.nombre = nombre.trim();
    }
    
    // Actualizar descripción si se proporciona
    if (descripcion !== undefined) {
      category.descripcion = descripcion?.trim() || null;
    }
    
    // Actualizar estado si se proporciona
    if (estado !== undefined && estado !== null) {
      // Si es booleano, convertir: true = 1 (Activo), false = 2 (Inactivo)
      if (typeof estado === 'boolean') {
        category.estado = { id: estado ? 1 : 2 } as any;
      } 
      // Si es string 'true'/'false', convertir
      else if (estado === 'true' || estado === 'false') {
        category.estado = { id: estado === 'true' ? 1 : 2 } as any;
      }
      // Si es un número, usarlo directamente
      else if (!isNaN(parseInt(estado))) {
        category.estado = { id: parseInt(estado) } as any;
      }
    }

    const updatedCategory = await categoryRepository.save(category);

    // Recargar con relaciones
    const categoryWithRelations = await categoryRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["productos", "estado"],
    });

    res.json(categoryWithRelations);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    console.error('❌ Error al actualizar categoría:', errorMessage);
    res.status(500).json({ message: errorMessage });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const categoryRepository = AppDataSource.getRepository(Categoria);

    const category = await categoryRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!category) {
      res.status(404).json({ message: "Categoría no encontrada" });
      return;
    }

    await categoryRepository.remove(category);
    res.json({ message: "Categoría eliminada correctamente" });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({ message: errorMessage });
  }
};
