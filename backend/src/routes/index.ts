import { Router } from 'express';
import authRoutes from './authRoutes';
import proyectoRoutes from './proyectos';

const router = Router();

// Rutas
router.use('/auth', authRoutes);
router.use('/proyectos', proyectoRoutes);

// Ruta de prueba
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

export default router;

