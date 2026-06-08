import express from 'express';
import {
  getAllSubcategories,
  getSubcategoriesByCategory,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from '../controllers/subcategoria.controller';

const router = express.Router();

// Rutas CRUD para subcategorías
router.get('/', getAllSubcategories);
router.get('/categoria/:categoriaId', getSubcategoriesByCategory);
router.get('/:id', getSubcategoryById);
router.post('/', createSubcategory);
router.put('/:id', updateSubcategory);
router.delete('/:id', deleteSubcategory);

export default router;
