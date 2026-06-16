import { Request, Response, NextFunction } from 'express';
import { productoService } from '../services/producto.service';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export class ProductController {
  
  public getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoriaId = req.query.categoriaId as string;
      const subcategoriaId = req.query.subcategoriaId as string;
      const searchQuery = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const products = await productoService.getAll(categoriaId, subcategoriaId, searchQuery, page, limit);
      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  public getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: 'ID de producto inválido' });
        return;
      }

      const product = await productoService.getById(id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  public createProduct = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let subcategoria_ids: number[] = [];
      try {
        subcategoria_ids = typeof req.body.subcategoria_ids === 'string' 
          ? JSON.parse(req.body.subcategoria_ids) 
          : (Array.isArray(req.body.subcategoria_ids) ? req.body.subcategoria_ids : []);
      } catch (e) {
        subcategoria_ids = [];
      }

      const productData = {
        nombre: req.body.nombre,
        marca: req.body.marca,
        precio: req.body.precio,
        descripcion: req.body.descripcion,
        stock: req.body.stock,
        estado: req.body.estado,
        categoria_id: req.body.categoria_id,
        subcategoria_ids,
        imagen: req.file ? `uploads/productos/${req.file.filename}` : undefined
      };

      const newProduct = await productoService.create(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      next(error);
    }
  };

  public updateProduct = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: 'ID de producto inválido' });
        return;
      }

      let subcategoria_ids: number[] | undefined;
      if (req.body.subcategoria_ids !== undefined) {
        try {
          subcategoria_ids = typeof req.body.subcategoria_ids === 'string' 
            ? JSON.parse(req.body.subcategoria_ids) 
            : (Array.isArray(req.body.subcategoria_ids) ? req.body.subcategoria_ids : []);
        } catch (e) {
          subcategoria_ids = [];
        }
      }

      const productData = {
        nombre: req.body.nombre,
        marca: req.body.marca,
        precio: req.body.precio,
        descripcion: req.body.descripcion,
        stock: req.body.stock,
        estado: req.body.estado,
        categoria_id: req.body.categoria_id,
        subcategoria_ids,
        imagen: req.file ? `uploads/productos/${req.file.filename}` : undefined
      };

      const updatedProduct = await productoService.update(id, productData);
      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  };

  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: 'ID de producto inválido' });
        return;
      }

      await productoService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public getProductsByIds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: 'Debes enviar un array de IDs' });
        return;
      }
      
      const numericIds = ids.map((id: any) => Number(id));
      const products = await productoService.getByIds(numericIds);
      res.json(products);
    } catch (error) {
      next(error);
    }
  };
}

const productController = new ProductController();

export const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByIds
} = productController;