import { Router } from 'express';
import { login, adminLogin, verifyToken, solicitarOTP, verificarOTP } from '../controllers/auth.controller';

const router = Router();

// Rutas de autenticación
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/verify', verifyToken);

// Rutas de OTP
router.post('/otp/solicitar', solicitarOTP);
router.post('/otp/verificar', verificarOTP);

export default router;