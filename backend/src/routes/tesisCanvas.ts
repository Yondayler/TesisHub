import { Router } from 'express';
import { TesisCanvasModel } from '../models/TesisCanvas';
import { authenticate } from '../middleware/auth';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * Función auxiliar para parsear JSON de forma segura
 * Si el string no es JSON válido, retorna el string original
 */
function parsearJsonSeguro(valor: string | null | undefined): any {
    if (!valor || valor.trim() === '') {
        return null;
    }
    
    try {
        // Intentar parsear como JSON
        return JSON.parse(valor);
    } catch (error) {
        // Si no es JSON válido, retornar el string original
        return valor;
    }
}

// Validaciones
const crearTesisValidation = [
    body('titulo').trim().notEmpty().withMessage('El título es requerido'),
    body('descripcion').trim().notEmpty().withMessage('La descripción es requerida'),
    body('carrera').trim().notEmpty().withMessage('La carrera es requerida'),
    body('tipo').isIn(['desarrollo_software', 'investigacion_campo', 'estudio_caso', 'revision_literatura'])
        .withMessage('Tipo de tesis inválido'),
    body('indice').optional().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        return typeof value === 'string' || typeof value === 'object';
    }).withMessage('Índice debe ser un string o objeto'),
    body('capitulos').optional().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        return typeof value === 'string' || typeof value === 'object';
    }).withMessage('Capítulos debe ser un string o objeto'),
    validateRequest
];

const actualizarTesisValidation = [
    param('id').isInt().withMessage('ID inválido'),
    body('titulo').optional().trim().notEmpty(),
    body('descripcion').optional().trim().notEmpty(),
    body('carrera').optional().trim().notEmpty(),
    body('tipo').optional().isIn(['desarrollo_software', 'investigacion_campo', 'estudio_caso', 'revision_literatura']),
    body('indice').optional().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        return typeof value === 'string' || typeof value === 'object';
    }).withMessage('Índice debe ser un string o objeto'),
    body('capitulos').optional().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        return typeof value === 'string' || typeof value === 'object';
    }).withMessage('Capítulos debe ser un string o objeto'),
    validateRequest
];

const eliminarTesisValidation = [
    param('id').isInt().withMessage('ID inválido'),
    validateRequest
];

/**
 * GET /api/tesis-canvas
 * Obtiene todas las tesis del usuario
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const usuario = req.usuario!;
        const tesis = await TesisCanvasModel.obtenerPorUsuario(usuario.id);

        res.json({
            success: true,
            data: tesis.map(t => ({
                id: t.id,
                titulo: t.titulo,
                descripcion: t.descripcion,
                carrera: t.carrera,
                tipo: t.tipo,
                indice: parsearJsonSeguro(t.indice),
                capitulos: parsearJsonSeguro(t.capitulos) || {},
                fecha_creacion: t.fecha_creacion,
                fecha_actualizacion: t.fecha_actualizacion
            }))
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/tesis-canvas/:id
 * Obtiene una tesis específica
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const usuario = req.usuario!;
        const id = parseInt(req.params.id);

        const tesis = await TesisCanvasModel.obtenerPorId(id, usuario.id);

        if (!tesis) {
            return res.status(404).json({
                success: false,
                error: 'Tesis no encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                id: tesis.id,
                titulo: tesis.titulo,
                descripcion: tesis.descripcion,
                carrera: tesis.carrera,
                tipo: tesis.tipo,
                indice: parsearJsonSeguro(tesis.indice),
                capitulos: parsearJsonSeguro(tesis.capitulos) || {},
                fecha_creacion: tesis.fecha_creacion,
                fecha_actualizacion: tesis.fecha_actualizacion
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/tesis-canvas
 * Crea una nueva tesis
 */
router.post('/', crearTesisValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const usuario = req.usuario!;
        const { titulo, descripcion, carrera, tipo, indice, capitulos } = req.body;

        // Si indice o capitulos ya son strings (JSON stringified), usarlos directamente
        // Si son objetos, hacer JSON.stringify
        let indiceStr = '';
        if (indice) {
            indiceStr = typeof indice === 'string' ? indice : JSON.stringify(indice);
        }

        let capitulosStr = '';
        if (capitulos) {
            capitulosStr = typeof capitulos === 'string' ? capitulos : JSON.stringify(capitulos);
        }

        const id = await TesisCanvasModel.crear({
            usuario_id: usuario.id,
            titulo,
            descripcion,
            carrera,
            tipo,
            indice: indiceStr,
            capitulos: capitulosStr
        });

        res.status(201).json({
            success: true,
            data: { id }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/tesis-canvas/:id
 * Actualiza una tesis existente
 */
router.put('/:id', actualizarTesisValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const usuario = req.usuario!;
        const id = parseInt(req.params.id);
        const { titulo, descripcion, carrera, tipo, indice, capitulos } = req.body;

        const datos: any = {};
        if (titulo !== undefined) datos.titulo = titulo;
        if (descripcion !== undefined) datos.descripcion = descripcion;
        if (carrera !== undefined) datos.carrera = carrera;
        if (tipo !== undefined) datos.tipo = tipo;
        if (indice !== undefined) {
            datos.indice = typeof indice === 'string' ? indice : JSON.stringify(indice);
        }
        if (capitulos !== undefined) {
            datos.capitulos = typeof capitulos === 'string' ? capitulos : JSON.stringify(capitulos);
        }

        await TesisCanvasModel.actualizar(id, usuario.id, datos);

        res.json({
            success: true,
            message: 'Tesis actualizada correctamente'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/tesis-canvas/:id
 * Elimina una tesis
 */
router.delete('/:id', eliminarTesisValidation, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const usuario = req.usuario!;
        const id = parseInt(req.params.id);

        await TesisCanvasModel.eliminar(id, usuario.id);

        res.json({
            success: true,
            message: 'Tesis eliminada correctamente'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
