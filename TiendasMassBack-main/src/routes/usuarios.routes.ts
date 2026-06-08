import { Router } from 'express';
import { getAllUsuarios, register, login, update, getUsuarioById,deleteUsuario } from '../controllers/usuarios.controller';
import { verificarToken } from '../middlewares/verificarToken';
import { requirePermiso } from '../middlewares/requirePermiso';
import { AdminModulo, AdminAccion } from '../entities/Permiso.entity';

const router = Router();

router.get('/', getAllUsuarios); // pública
router.get('/:id',  getUsuarioById); // protegida
router.post('/', register); // crear usuario (alias de /register)
router.post('/register', register); // pública
router.post('/login', login); // pública
router.put(
    '/update/:id',
    verificarToken,
    requirePermiso(AdminModulo.USUARIOS, AdminAccion.UPDATE),
    update
); // protegida

router.delete(
    '/delete/:id',
    verificarToken,
    requirePermiso(AdminModulo.USUARIOS, AdminAccion.DELETE),
    deleteUsuario
); // protegida

    // 

export default router;
