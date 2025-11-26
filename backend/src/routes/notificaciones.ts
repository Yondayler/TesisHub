import { Router } from 'express';
import { NotificacionController } from '../controllers/notificacionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de notificaciones
router.get('/', NotificacionController.obtenerNotificaciones);
router.get('/no-leidas/count', NotificacionController.contarNoLeidas);
router.patch('/:id/leer', NotificacionController.marcarComoLeida);
router.patch('/marcar-todas-leidas', NotificacionController.marcarTodasComoLeidas);
router.delete('/:id', NotificacionController.eliminarNotificacion);

export default router;






