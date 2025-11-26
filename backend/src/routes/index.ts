import { Router } from 'express';
import authRoutes from './authRoutes';
import proyectoRoutes from './proyectos';
import usuarioRoutes from './usuarios';
import notificacionRoutes from './notificaciones';
import archivoRoutes from './archivos';
import comentarioRoutes from './comentarios';
import tutorRoutes from './tutores';
import auditoriaRoutes from './auditoria';

const router = Router();

// Rutas
router.use('/auth', authRoutes);
router.use('/proyectos', proyectoRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/notificaciones', notificacionRoutes);
router.use('/comentarios', comentarioRoutes);
router.use('/tutores', tutorRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/', archivoRoutes);

// Ruta de prueba
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

export default router;

