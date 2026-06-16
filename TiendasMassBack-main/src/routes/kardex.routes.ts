import { Router } from 'express';
import { getAllKardex, getByProductoId, registrarMovimiento } from '../controllers/kardex.controller';

const router = Router();

// GET /api/kardex - Historial completo de movimientos (filtra por productoId o tipoMovimiento en query)
router.get('/', getAllKardex);

// GET /api/kardex/producto/:productoId - Historial de un producto específico
router.get('/producto/:productoId', getByProductoId);

// POST /api/kardex - Registrar entrada/salida/ajuste
router.post('/', registrarMovimiento);

export default router;
