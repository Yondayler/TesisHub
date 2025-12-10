import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { upload } from '../middleware/upload';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Validaciones
const enviarMensajeValidation = [
  body('mensaje')
    .trim()
    .notEmpty().withMessage('El mensaje es requerido')
    .isLength({ min: 1, max: 5000 }).withMessage('El mensaje debe tener entre 1 y 5000 caracteres'),
  body('proyectoId')
    .optional()
    .isInt({ min: 1 }).withMessage('El ID del proyecto debe ser un número válido'),
  body('modelo')
    .optional()
    .isIn(['rapido', 'razonamiento']).withMessage('El modelo debe ser "rapido" o "razonamiento"'),
  body('mensajesAnteriores')
    .optional()
    .isArray().withMessage('Los mensajes anteriores deben ser un array'),
  body('mensajesAnteriores.*.role')
    .optional()
    .isIn(['user', 'assistant']).withMessage('El rol debe ser "user" o "assistant"'),
  body('mensajesAnteriores.*.content')
    .optional()
    .isString().withMessage('El contenido del mensaje debe ser un string'),
  validateRequest
];

// Rutas
router.post('/mensaje', enviarMensajeValidation, ChatController.enviarMensaje);
router.get('/historial', ChatController.obtenerHistorial);
router.get('/conversaciones', ChatController.listarConversaciones);
router.post('/conversaciones', ChatController.crearConversacion);
router.delete('/conversaciones/:id', ChatController.eliminarConversacion);
router.get('/sugerencias', ChatController.obtenerSugerencias);

// Ruta para subir archivos
router.post('/upload', upload.single('file'), ChatController.subirArchivo);

export default router;


