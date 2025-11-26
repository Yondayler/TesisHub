import { Router } from 'express';
import { AuditoriaController } from '../controllers/auditoriaController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de auditoría (solo administradores)
router.get('/', AuditoriaController.obtenerTodos);
router.get('/administrador/:id', AuditoriaController.obtenerPorAdministrador);
router.get('/entidad/:entidad', AuditoriaController.obtenerPorEntidad);

export default router;

