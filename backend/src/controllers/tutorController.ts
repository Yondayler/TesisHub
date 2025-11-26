import { Response, NextFunction } from 'express';
import { TutorService } from '../services/tutorService';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

export class TutorController {
  // GET /api/tutores/estudiantes - Obtener estudiantes tutorizados
  static async obtenerEstudiantesTutorizados(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      if (usuario.rol !== 'tutor') {
        sendError(res, 'Solo los tutores pueden acceder a esta información', 403);
        return;
      }

      const estudiantes = await TutorService.obtenerEstudiantesTutorizados(usuario.id);
      sendSuccess(res, estudiantes, 'Estudiantes tutorizados obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/tutores/estudiantes/:estudianteId/proyectos - Obtener proyectos de un estudiante
  static async obtenerProyectosPorEstudiante(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario!;
      const estudianteId = parseInt(req.params.estudianteId);

      if (usuario.rol !== 'tutor') {
        sendError(res, 'Solo los tutores pueden acceder a esta información', 403);
        return;
      }

      if (isNaN(estudianteId)) {
        sendError(res, 'ID de estudiante inválido', 400);
        return;
      }

      const proyectos = await TutorService.obtenerProyectosPorEstudiante(
        estudianteId,
        usuario.id
      );
      sendSuccess(res, proyectos, 'Proyectos obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}

