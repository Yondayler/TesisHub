import { Request, Response, NextFunction } from 'express';
import { NotificacionService } from '../services/notificacionService';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class NotificacionController {
  // GET /api/notificaciones - Obtener notificaciones del usuario
  static async obtenerNotificaciones(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      const soloNoLeidas = req.query.leidas === 'false';

      const notificaciones = await NotificacionService.obtenerNotificacionesUsuario(
        usuario.id,
        soloNoLeidas
      );

      sendSuccess(res, notificaciones, 'Notificaciones obtenidas exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/notificaciones/no-leidas/count - Contar notificaciones no leídas
  static async contarNoLeidas(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;

      const count = await NotificacionService.contarNoLeidas(usuario.id);

      sendSuccess(res, { count }, 'Conteo de notificaciones obtenido exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // PATCH /api/notificaciones/:id/leer - Marcar notificación como leída
  static async marcarComoLeida(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'ID de notificación inválido', 400);
        return;
      }

      await NotificacionService.marcarComoLeida(id, usuario.id);

      sendSuccess(res, null, 'Notificación marcada como leída');
    } catch (error: any) {
      next(error);
    }
  }

  // PATCH /api/notificaciones/marcar-todas-leidas - Marcar todas las notificaciones como leídas
  static async marcarTodasComoLeidas(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;

      const count = await NotificacionService.marcarTodasComoLeidas(usuario.id);

      sendSuccess(res, { marcadas: count }, 'Todas las notificaciones han sido marcadas como leídas');
    } catch (error: any) {
      next(error);
    }
  }

  // DELETE /api/notificaciones/:id - Eliminar notificación
  static async eliminarNotificacion(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'ID de notificación inválido', 400);
        return;
      }

      await NotificacionService.eliminarNotificacion(id, usuario.id);

      sendSuccess(res, null, 'Notificación eliminada exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}







