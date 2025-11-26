import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de usuarios (solo administradores)
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros dinámicos

// Rutas de administradores (solo administradores) - DEBEN IR PRIMERO
router.get('/administradores', UsuarioController.obtenerAdministradores);
router.post('/administradores', UsuarioController.crearAdministrador);
router.put('/administradores/:id', UsuarioController.actualizarAdministrador);
router.delete('/administradores/:id', UsuarioController.eliminarAdministrador);

// Rutas de tutores
router.post('/tutores', UsuarioController.crearTutor);
router.get('/tutores', UsuarioController.obtenerTutores);
router.delete('/tutores/:id', UsuarioController.eliminarTutor);

// Rutas de estudiantes
router.get('/estudiantes', UsuarioController.obtenerEstudiantes);

// Rutas de verificación
router.get('/verificar-email/:email', UsuarioController.verificarEmail);

// Ruta dinámica por ID (DEBE IR AL FINAL para no capturar otras rutas)
router.get('/:id', UsuarioController.obtenerUsuario);

export default router;





