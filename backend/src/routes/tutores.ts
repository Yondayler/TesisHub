import { Router } from 'express';
import { TutorController } from '../controllers/tutorController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener estudiantes tutorizados
router.get(
  '/estudiantes',
  TutorController.obtenerEstudiantesTutorizados
);

// Obtener proyectos de un estudiante específico
router.get(
  '/estudiantes/:estudianteId/proyectos',
  TutorController.obtenerProyectosPorEstudiante
);

export default router;



