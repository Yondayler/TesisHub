import { Router } from 'express';
import { ComentarioController } from '../controllers/comentarioController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Validaciones
const crearComentarioValidation = [
  body('proyecto_id')
    .isInt({ min: 1 }).withMessage('ID de proyecto inválido'),
  body('comentario')
    .trim()
    .notEmpty().withMessage('El comentario es requerido')
    .isLength({ min: 1, max: 2000 }).withMessage('El comentario debe tener entre 1 y 2000 caracteres'),
  body('tipo_comentario')
    .optional()
    .isIn(['general', 'correccion', 'pregunta', 'respuesta']).withMessage('Tipo de comentario inválido'),
  body('comentario_padre_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID de comentario padre inválido'),
  validateRequest
];

// Rutas
router.post(
  '/',
  crearComentarioValidation,
  ComentarioController.crearComentario
);

router.get(
  '/proyecto/:proyectoId',
  ComentarioController.obtenerComentariosPorProyecto
);

router.put(
  '/:id',
  [
    body('comentario')
      .trim()
      .notEmpty().withMessage('El comentario es requerido')
      .isLength({ min: 1, max: 2000 }).withMessage('El comentario debe tener entre 1 y 2000 caracteres'),
    validateRequest
  ],
  ComentarioController.actualizarComentario
);

router.delete(
  '/:id',
  ComentarioController.eliminarComentario
);

export default router;




