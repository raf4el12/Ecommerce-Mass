import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Producto } from '../entities/Producto.entity';
import { Categoria } from '../entities/Categoria.entity';
import { Subcategoria } from '../entities/Subcategoria.entity';
import { Estado } from '../entities/Estado.entity';
import { ApiError } from '../middlewares/errorHandler';

// DTOs para el servicio
export interface CreateProductDto {
  nombre: string;
  marca?: string;
  precio: number;
  descripcion?: string;
  stock?: number;
  estado?: boolean;
  categoria_id: number;
  subcategoria_ids?: number[];
  imagen?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export class ProductoService {
  private productRepository: Repository<Producto>;
  private categoryRepository: Repository<Categoria>;
  private subcategoryRepository: Repository<Subcategoria>;
  private estadoRepository: Repository<Estado>;

  constructor() {
    this.productRepository = AppDataSource.getRepository(Producto);
    this.categoryRepository = AppDataSource.getRepository(Categoria);
    this.subcategoryRepository = AppDataSource.getRepository(Subcategoria);
    this.estadoRepository = AppDataSource.getRepository(Estado);
  }

  // Helper para normalizar
  public normalizeProduct = (product: Producto) => {
    return {
      ...product,
      precio: Number(product.precio),
      stock: Number(product.stock),
      categoria_id: product.categoria?.id,
      subcategoria_ids: product.subcategorias?.map(s => s.id) || [],
      estado_nombre: product.estado?.nombre
    };
  };

  public async getAll(categoriaId?: string, subcategoriaId?: string, searchQuery?: string, page?: number, limit?: number) {
    const baseQuery = this.productRepository
      .createQueryBuilder('producto')
      .distinct(true)
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .leftJoinAndSelect('producto.subcategorias', 'subcategorias')
      .leftJoinAndSelect('producto.estado', 'estado');

    if (categoriaId) {
      baseQuery.andWhere('categoria.id = :categoriaId', { categoriaId: parseInt(categoriaId) });
    }

    if (subcategoriaId) {
      baseQuery.andWhere('subcategorias.id = :subcategoriaId', { subcategoriaId: parseInt(subcategoriaId) });
    }

    if (searchQuery) {
      baseQuery.andWhere(
        '(LOWER(producto.nombre) LIKE :q OR LOWER(producto.descripcion) LIKE :q)',
        { q: `%${searchQuery.toLowerCase()}%` }
      );
    }

    if (page && limit) {
      const skip = (page - 1) * limit;
      baseQuery.skip(skip).take(limit);
      const [products, total] = await baseQuery.getManyAndCount();
      return {
        data: products.map(this.normalizeProduct),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } else {
      const products = await baseQuery.getMany();
      return products.map(this.normalizeProduct);
    }
  }

  public async getById(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['categoria', 'subcategorias', 'estado']
    });

    if (!product) {
      throw new ApiError('Producto no encontrado', 404);
    }

    return this.normalizeProduct(product);
  }

  public async create(data: CreateProductDto) {
    const category = await this.categoryRepository.findOne({ where: { id: data.categoria_id } });
    if (!category) {
      throw new ApiError('Categoría no válida', 400);
    }

    let subcategories: Subcategoria[] = [];
    if (data.subcategoria_ids && data.subcategoria_ids.length > 0) {
      subcategories = await this.subcategoryRepository.find({
        where: { id: In(data.subcategoria_ids), categoria: { id: data.categoria_id } }
      });
      if (subcategories.length !== data.subcategoria_ids.length) {
        throw new ApiError('Una o más subcategorías no son válidas o no pertenecen a la categoría', 400);
      }
    }

    const estadoNombre = data.estado ? 'Activo' : 'Inactivo';
    let estadoEntity = await this.estadoRepository.findOne({ where: { nombre: estadoNombre } });

    if (!estadoEntity) {
      estadoEntity = await this.estadoRepository.findOne({});
      if (!estadoEntity) {
        throw new ApiError('No se encontraron estados disponibles', 500);
      }
    }

    const newProduct = this.productRepository.create({
      nombre: data.nombre,
      marca: data.marca,
      precio: parseFloat(data.precio.toString()),
      descripcion: data.descripcion,
      imagen: data.imagen,
      stock: parseInt((data.stock || 0).toString()),
      categoria: category,
      estado: estadoEntity
    });

    const savedProduct = await this.productRepository.save(newProduct);

    if (subcategories.length > 0) {
      await this.productRepository
        .createQueryBuilder()
        .relation(Producto, 'subcategorias')
        .of(savedProduct.id)
        .add(subcategories);
    }

    const fullProduct = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['categoria', 'subcategorias', 'estado']
    });

    return this.normalizeProduct(fullProduct!);
  }

  public async update(id: number, data: UpdateProductDto) {
    const existingProduct = await this.productRepository.findOne({
      where: { id },
      relations: ['categoria', 'subcategorias', 'estado']
    });

    if (!existingProduct) {
      throw new ApiError('Producto no encontrado', 404);
    }

    let category = existingProduct.categoria;
    if (data.categoria_id && data.categoria_id !== existingProduct.categoria.id) {
      const newCategory = await this.categoryRepository.findOne({ where: { id: data.categoria_id } });
      if (!newCategory) {
        throw new ApiError('Categoría no válida', 400);
      }
      category = newCategory;
    }

    let subcategories: Subcategoria[] = existingProduct.subcategorias || [];
    if (data.subcategoria_ids !== undefined) {
      if (data.subcategoria_ids.length > 0) {
        subcategories = await this.subcategoryRepository.find({
          where: { id: In(data.subcategoria_ids), categoria: { id: category.id } }
        });
        if (subcategories.length !== data.subcategoria_ids.length) {
          throw new ApiError('Una o más subcategorías no son válidas o no pertenecen a la categoría', 400);
        }
      } else {
        subcategories = [];
      }
    }

    if (data.nombre !== undefined) existingProduct.nombre = data.nombre;
    if (data.marca !== undefined) existingProduct.marca = data.marca;
    if (data.precio !== undefined) existingProduct.precio = parseFloat(data.precio.toString());
    if (data.descripcion !== undefined) existingProduct.descripcion = data.descripcion;
    if (data.stock !== undefined) existingProduct.stock = parseInt(data.stock.toString());
    if (data.categoria_id !== undefined) existingProduct.categoria = category;
    if (data.imagen !== undefined) existingProduct.imagen = data.imagen;

    if (data.estado !== undefined && data.estado !== null) {
      const estadoId = data.estado ? 1 : 2;
      const estadoEntity = await this.estadoRepository.findOne({ where: { id: estadoId } });
      if (estadoEntity) {
        existingProduct.estado = estadoEntity;
      }
    }

    const savedProduct = await this.productRepository.save(existingProduct);

    if (data.subcategoria_ids !== undefined) {
      await this.productRepository
        .createQueryBuilder()
        .relation(Producto, 'subcategorias')
        .of(savedProduct.id)
        .remove(existingProduct.subcategorias);

      if (subcategories.length > 0) {
        await this.productRepository
          .createQueryBuilder()
          .relation(Producto, 'subcategorias')
          .of(savedProduct.id)
          .add(subcategories);
      }
    }

    const fullProduct = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['categoria', 'subcategorias', 'estado']
    });

    return this.normalizeProduct(fullProduct!);
  }

  public async delete(id: number) {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new ApiError('Producto no encontrado', 404);
    }
  }

  public async getByIds(ids: number[]) {
    const products = await this.productRepository.find({
      where: { id: In(ids) }
    });
    return products.map(this.normalizeProduct);
  }
}

export const productoService = new ProductoService();
