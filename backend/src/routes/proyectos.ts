import { Router } from 'express';
import { ProyectoController } from '../controllers/proyectoController';
import { authenticate } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Validaciones
const crearProyectoValidation = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 20 }).withMessage('La descripción debe tener al menos 20 caracteres'),
  body('planteamiento')
    .trim()
    .notEmpty().withMessage('El planteamiento es requerido')
    .isLength({ min: 20 }).withMessage('El planteamiento debe tener al menos 20 caracteres'),
  body('solucion_problema')
    .trim()
    .notEmpty().withMessage('La solución propuesta es requerida')
    .isLength({ min: 20 }).withMessage('La solución propuesta debe tener al menos 20 caracteres'),
  body('objetivo_general')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('El objetivo general es demasiado largo'),
  body('objetivos_especificos')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Los objetivos específicos son demasiado largos'),
  body('justificacion')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La justificación es demasiado larga'),
  body('metodologia')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('La metodología es demasiado larga'),
  body('resultados_esperados')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Los resultados esperados son demasiado largos'),
  body('presupuesto_estimado')
    .optional()
    .isFloat({ min: 0 }).withMessage('El presupuesto debe ser un número positivo'),
  body('duracion_meses')
    .optional()
    .isInt({ min: 1, max: 60 }).withMessage('La duración debe estar entre 1 y 60 meses'),
  validateRequest
];

const actualizarProyectoValidation = [
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage('La descripción debe tener al menos 20 caracteres'),
  body('planteamiento')
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage('El planteamiento debe tener al menos 20 caracteres'),
  body('solucion_problema')
    .optional()
    .trim()
    .isLength({ min: 20 }).withMessage('La solución propuesta debe tener al menos 20 caracteres'),
  body('objetivo_general')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('El objetivo general es demasiado largo'),
  body('objetivos_especificos')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Los objetivos específicos son demasiado largos'),
  body('justificacion')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('La justificación es demasiado larga'),
  body('metodologia')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('La metodología es demasiado larga'),
  body('resultados_esperados')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Los resultados esperados son demasiado largos'),
  body('presupuesto_estimado')
    .optional()
    .isFloat({ min: 0 }).withMessage('El presupuesto debe ser un número positivo'),
  body('duracion_meses')
    .optional()
    .isInt({ min: 1, max: 60 }).withMessage('La duración debe estar entre 1 y 60 meses'),
  validateRequest
];

const cambiarEstadoValidation = [
  body('estado')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(['borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'corregir'])
    .withMessage('Estado inválido'),
  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Las observaciones son demasiado largas'),
  validateRequest
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  validateRequest
];

// Rutas
router.get('/estadisticas', ProyectoController.obtenerEstadisticas);
router.get('/grafico', ProyectoController.obtenerDatosGrafico);
router.get('/estudiante/:id', ProyectoController.obtenerProyectosPorEstudiante);
router.get('/', ProyectoController.obtenerProyectos);
router.get('/:id', idValidation, ProyectoController.obtenerProyecto);
router.post('/', crearProyectoValidation, ProyectoController.crearProyecto);
router.put('/:id', [...idValidation, ...actualizarProyectoValidation], ProyectoController.actualizarProyecto);
router.patch('/:id/estado', [...idValidation, ...cambiarEstadoValidation], ProyectoController.cambiarEstado);
router.patch('/:id/asignar-tutor', idValidation, ProyectoController.asignarTutor);
router.patch('/:id/remover-tutor', idValidation, ProyectoController.removerTutor);
router.get('/:id/observaciones', idValidation, ProyectoController.obtenerObservaciones);
router.post('/:id/observaciones', [
  ...idValidation,
  body('observacion')
    .trim()
    .notEmpty().withMessage('La observación es requerida')
    .isLength({ min: 1, max: 2000 }).withMessage('La observación debe tener entre 1 y 2000 caracteres'),
  validateRequest
], ProyectoController.agregarObservacion);
router.delete('/:id', idValidation, ProyectoController.eliminarProyecto);

export default router;

