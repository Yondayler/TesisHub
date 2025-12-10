import { Router } from 'express';
import { CanvasController } from '../controllers/canvasController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Validaciones para generar índice
const generarIndiceValidation = [
    body('titulo')
        .trim()
        .notEmpty().withMessage('El título es requerido')
        .isLength({ min: 10, max: 200 }).withMessage('El título debe tener entre 10 y 200 caracteres'),
    body('descripcion')
        .trim()
        .notEmpty().withMessage('La descripción es requerida')
        .isLength({ min: 20, max: 1000 }).withMessage('La descripción debe tener entre 20 y 1000 caracteres'),
    body('carrera')
        .trim()
        .notEmpty().withMessage('La carrera es requerida'),
    body('tipo')
        .isIn(['desarrollo_software', 'investigacion_campo', 'estudio_caso', 'revision_literatura'])
        .withMessage('Tipo de tesis inválido'),
    body('modelo')
        .optional()
        .isIn(['rapido', 'razonamiento', 'canvas'])
        .withMessage('Modelo debe ser "rapido", "razonamiento" o "canvas"'),
    validateRequest
];

// Validaciones para generar capítulo
const generarCapituloValidation = [
    body('numeroCapitulo')
        .isInt({ min: 1, max: 10 }).withMessage('Número de capítulo inválido'),
    body('tituloCapitulo')
        .trim()
        .notEmpty().withMessage('El título del capítulo es requerido'),
    body('subsecciones')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos una subsección'),
    body('contextoTesis')
        .isObject().withMessage('contextoTesis debe ser un objeto'),
    body('contextoTesis.titulo')
        .notEmpty().withMessage('contextoTesis.titulo es requerido'),
    body('contextoTesis.descripcion')
        .notEmpty().withMessage('contextoTesis.descripcion es requerido'),
    body('contextoTesis.carrera')
        .notEmpty().withMessage('contextoTesis.carrera es requerido'),
    body('contextoTesis.tipo')
        .notEmpty().withMessage('contextoTesis.tipo es requerido'),
    body('capitulosAnteriores')
        .optional()
        .isArray().withMessage('capitulosAnteriores debe ser un array'),
    body('modelo')
        .optional()
        .isIn(['rapido', 'razonamiento', 'canvas'])
        .withMessage('Modelo debe ser "rapido", "razonamiento" o "canvas"'),
    validateRequest
];

// Validaciones para exportar documento (soporta ambos formatos)
const exportarWordValidation = [
    body('documento')
        .isObject().withMessage('documento debe ser un objeto'),
    body('documento.portada')
        .isObject().withMessage('documento.portada es requerido'),
    // Validación flexible: debe tener capitulos O seccionesHTML
    body('documento').custom((value) => {
        if (!value.capitulos && !value.seccionesHTML) {
            throw new Error('documento debe incluir capitulos o seccionesHTML');
        }
        return true;
    }),
    validateRequest
];

// Validaciones para exportar capítulo
const exportarCapituloValidation = [
    body('capitulo')
        .isObject().withMessage('capitulo debe ser un objeto'),
    body('capitulo.numero')
        .isInt({ min: 1 }).withMessage('capitulo.numero es requerido'),
    body('capitulo.titulo')
        .notEmpty().withMessage('capitulo.titulo es requerido'),
    body('capitulo.subsecciones')
        .isArray({ min: 1 }).withMessage('capitulo.subsecciones es requerido'),
    validateRequest
];

// Rutas
router.post('/generar-indice', generarIndiceValidation, CanvasController.generarIndice);
router.post('/generar-capitulo', generarCapituloValidation, CanvasController.generarCapitulo);
router.post('/exportar-word', exportarWordValidation, CanvasController.exportarWord);
router.post('/exportar-pdf', exportarWordValidation, CanvasController.exportarPdf);
router.post('/exportar-capitulo', exportarCapituloValidation, CanvasController.exportarCapitulo);

// Validaciones para generar título
const generarTituloValidation = [
    body('tema')
        .trim()
        .notEmpty().withMessage('El tema es requerido')
        .isLength({ min: 5, max: 200 }).withMessage('El tema debe tener entre 5 y 200 caracteres'),
    body('carrera')
        .trim()
        .notEmpty().withMessage('La carrera es requerida'),
    validateRequest
];

router.post('/generar-titulo', generarTituloValidation, CanvasController.generarTitulo);

// Ruta para verificar salud del modelo
router.get('/health-check', CanvasController.healthCheck);

// Ruta SSE para streaming de sección individual
router.get('/generar-seccion-stream/:seccion', CanvasController.generarSeccionStream);

// Ruta SSE para streaming de tesis completa
router.get('/generar-tesis-completa-stream', CanvasController.generarTesisCompleta);

export default router;
