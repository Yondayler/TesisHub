import { Response, NextFunction } from 'express';
import { ComentarioService } from '../services/comentarioService';
import { AuthRequest, Comentario } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class ComentarioController {
  // POST /api/comentarios - Crear comentario
  static async crearComentario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      const comentarioData: Omit<Comentario, 'id' | 'fecha_comentario' | 'editado'> = {
        proyecto_id: parseInt(req.body.proyecto_id),
        usuario_id: usuario.id,
        comentario: req.body.comentario,
        tipo_comentario: req.body.tipo_comentario || 'general',
        comentario_padre_id: req.body.comentario_padre_id || undefined
      };

      const comentario = await ComentarioService.crearComentario(comentarioData, usuario);
      sendSuccess(res, comentario, 'Comentario creado exitosamente', 201);
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/comentarios/proyecto/:proyectoId - Obtener comentarios de un proyecto
  static async obtenerComentariosPorProyecto(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario!;
      const proyectoId = parseInt(req.params.proyectoId);

      if (isNaN(proyectoId)) {
        sendError(res, 'ID de proyecto inválido', 400);
        return;
      }

      const comentarios = await ComentarioService.obtenerComentariosPorProyecto(proyectoId, usuario);
      sendSuccess(res, comentarios, 'Comentarios obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // PUT /api/comentarios/:id - Actualizar comentario
  static async actualizarComentario(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario!;
      const comentarioId = parseInt(req.params.id);
      const { comentario } = req.body;

      if (isNaN(comentarioId)) {
        sendError(res, 'ID de comentario inválido', 400);
        return;
      }

      if (!comentario || comentario.trim().length === 0) {
        sendError(res, 'El comentario no puede estar vacío', 400);
        return;
      }

      const comentarioActualizado = await ComentarioService.actualizarComentario(
        comentarioId,
        comentario,
        usuario
      );
      sendSuccess(res, comentarioActualizado, 'Comentario actualizado exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // DELETE /api/comentarios/:id - Eliminar comentario
  static async eliminarComentario(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario!;
      const comentarioId = parseInt(req.params.id);

      if (isNaN(comentarioId)) {
        sendError(res, 'ID de comentario inválido', 400);
        return;
      }

      await ComentarioService.eliminarComentario(comentarioId, usuario);
      sendSuccess(res, null, 'Comentario eliminado exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}




