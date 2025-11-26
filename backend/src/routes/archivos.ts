import { Router } from 'express';
import { ArchivoController } from '../controllers/archivoController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir archivo a un proyecto
router.post(
  '/proyectos/:proyectoId/archivos',
  upload.single('archivo'),
  ArchivoController.subirArchivo
);

// Obtener archivos de un proyecto
router.get(
  '/proyectos/:proyectoId/archivos',
  ArchivoController.obtenerArchivosPorProyecto
);

// Descargar archivo
router.get(
  '/archivos/:id/descargar',
  ArchivoController.descargarArchivo
);

// Eliminar archivo
router.delete(
  '/archivos/:id',
  ArchivoController.eliminarArchivo
);

export default router;






