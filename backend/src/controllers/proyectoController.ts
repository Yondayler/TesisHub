import { Request, Response, NextFunction } from 'express';
import { ProyectoService } from '../services/proyectoService';
import { AuthRequest, Proyecto } from '../types';

export class ProyectoController {
  // GET /api/proyectos - Obtener proyectos del usuario
  static async obtenerProyectos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const proyectos = await ProyectoService.obtenerProyectos(usuario);
      
      res.json({
        success: true,
        data: proyectos
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/proyectos/estadisticas - Obtener estadísticas
  static async obtenerEstadisticas(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const estadisticas = await ProyectoService.obtenerEstadisticas(usuario);
      
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/proyectos/:id - Obtener proyecto por ID
  static async obtenerProyecto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const id = parseInt(req.params.id);
      
      const proyecto = await ProyectoService.obtenerProyectoPorId(id, usuario);
      
      res.json({
        success: true,
        data: proyecto
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/proyectos - Crear proyecto
  static async crearProyecto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const proyectoData: Proyecto = {
        ...req.body,
        estudiante_id: usuario.rol === 'estudiante' ? usuario.id : req.body.estudiante_id
      };
      
      const proyecto = await ProyectoService.crearProyecto(proyectoData, usuario);
      
      res.status(201).json({
        success: true,
        message: 'Proyecto creado exitosamente',
        data: proyecto
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/proyectos/:id - Actualizar proyecto
  static async actualizarProyecto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const id = parseInt(req.params.id);
      const proyectoData = req.body;
      
      const proyecto = await ProyectoService.actualizarProyecto(id, proyectoData, usuario);
      
      res.json({
        success: true,
        message: 'Proyecto actualizado exitosamente',
        data: proyecto
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/proyectos/:id/estado - Cambiar estado del proyecto
  static async cambiarEstado(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const id = parseInt(req.params.id);
      const { estado, observaciones } = req.body;
      
      const proyecto = await ProyectoService.cambiarEstado(id, estado, observaciones, usuario);
      
      res.json({
        success: true,
        message: 'Estado del proyecto actualizado exitosamente',
        data: proyecto
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/proyectos/:id - Eliminar proyecto
  static async eliminarProyecto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const id = parseInt(req.params.id);
      
      await ProyectoService.eliminarProyecto(id, usuario);
      
      res.json({
        success: true,
        message: 'Proyecto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}


