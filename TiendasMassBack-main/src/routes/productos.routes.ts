import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductsByIds } from '../controllers/productos.controller';
import upload from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import { createProductSchema, updateProductSchema } from '../validators/producto.validator';

const router = Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.post('/', upload.single('imagen'), validate(createProductSchema), createProduct);

router.put('/:id', upload.single('imagen'), validate(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

router.post('/bulk', getProductsByIds);

export default router;
