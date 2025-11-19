import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/registro', AuthController.registrar);
router.post('/login', AuthController.login);

// Rutas protegidas
router.get('/perfil', authenticate, AuthController.perfil);

export default router;


