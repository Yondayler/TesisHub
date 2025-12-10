import { Request, Response, NextFunction } from 'express';
import { AuditoriaService } from '../services/auditoriaService';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class AuditoriaController {
  // GET /api/auditoria - Obtener todos los registros de auditoría (solo administradores)
  static async obtenerTodos(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const registros = await AuditoriaService.obtenerTodos(limit, offset);
      const total = await AuditoriaService.contar();

      sendSuccess(res, { registros, total }, 'Registros de auditoría obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/auditoria/administrador/:id - Obtener registros por administrador (solo administradores)
  static async obtenerPorAdministrador(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const administradorId = parseInt(req.params.id);
      if (isNaN(administradorId)) {
        sendError(res, 'ID inválido', 400);
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const registros = await AuditoriaService.obtenerPorAdministrador(administradorId, limit, offset);

      sendSuccess(res, registros, 'Registros de auditoría obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/auditoria/entidad/:entidad - Obtener registros por entidad (solo administradores)
  static async obtenerPorEntidad(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const entidad = req.params.entidad;
      const entidadId = req.query.entidad_id ? parseInt(req.query.entidad_id as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const registros = await AuditoriaService.obtenerPorEntidad(entidad, entidadId, limit, offset);

      sendSuccess(res, registros, 'Registros de auditoría obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}


