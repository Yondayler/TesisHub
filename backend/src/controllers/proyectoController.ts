import { Request, Response, NextFunction } from 'express';
import { ProyectoService } from '../services/proyectoService';
import { AuthRequest, Proyecto } from '../types';
import { registrarAuditoria } from '../utils/auditoriaHelper';

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

  // GET /api/proyectos/grafico - Obtener datos para gráfico por fecha
  static async obtenerDatosGrafico(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      
      // Solo administradores pueden ver este gráfico
      if (usuario.rol !== 'administrador') {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para acceder a estos datos'
        });
      }

      const dias = parseInt(req.query.dias as string) || 90;
      const datos = await ProyectoService.obtenerProyectosPorFecha(dias);
      
      res.json({
        success: true,
        data: datos
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

  // GET /api/proyectos/estudiante/:id - Obtener proyectos de un estudiante específico (solo administradores)
  static async obtenerProyectosPorEstudiante(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const estudianteId = parseInt(req.params.id);

      if (isNaN(estudianteId)) {
        res.status(400).json({
          success: false,
          message: 'ID de estudiante inválido'
        });
        return;
      }

      const proyectos = await ProyectoService.obtenerProyectosPorEstudiante(estudianteId, usuario);

      res.json({
        success: true,
        data: proyectos
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/proyectos/:id/asignar-tutor - Asignar tutor a un proyecto (solo administradores)
  static async asignarTutor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const proyectoId = parseInt(req.params.id);
      const { tutor_id } = req.body;

      if (isNaN(proyectoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de proyecto inválido'
        });
        return;
      }

      if (!tutor_id) {
        res.status(400).json({
          success: false,
          message: 'ID de tutor requerido'
        });
        return;
      }

      // Obtener datos del proyecto antes para auditoría
      const proyectoAnterior = await ProyectoService.obtenerProyectoPorId(proyectoId, usuario);
      
      const proyecto = await ProyectoService.asignarTutor(proyectoId, tutor_id, usuario);

      // Registrar en auditoría
      await registrarAuditoria(
        usuario.id!,
        'ASIGNAR_TUTOR',
        'PROYECTO',
        proyectoId,
        `Tutor asignado al proyecto: ${proyecto.titulo}`,
        { tutor_id: proyectoAnterior?.tutor_id },
        { tutor_id: tutor_id }
      );

      res.json({
        success: true,
        message: 'Tutor asignado exitosamente',
        data: proyecto
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/proyectos/:id/remover-tutor - Remover tutor de un proyecto (solo administradores)
  static async removerTutor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const proyectoId = parseInt(req.params.id);

      if (isNaN(proyectoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de proyecto inválido'
        });
        return;
      }

      const proyecto = await ProyectoService.removerTutor(proyectoId, usuario);

      res.json({
        success: true,
        message: 'Tutor removido exitosamente',
        data: proyecto
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/proyectos/:id/observaciones - Obtener todas las observaciones de un proyecto
  static async obtenerObservaciones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const proyectoId = parseInt(req.params.id);

      if (isNaN(proyectoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de proyecto inválido'
        });
        return;
      }

      const { ObservacionProyectoModel } = await import('../models/ObservacionProyecto');
      const observaciones = await ObservacionProyectoModel.obtenerPorProyecto(proyectoId);

      res.json({
        success: true,
        data: observaciones
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/proyectos/:id/observaciones - Agregar una observación al proyecto
  static async agregarObservacion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const proyectoId = parseInt(req.params.id);
      const { observacion } = req.body;

      if (isNaN(proyectoId)) {
        res.status(400).json({
          success: false,
          message: 'ID de proyecto inválido'
        });
        return;
      }

      if (!observacion || !observacion.trim()) {
        res.status(400).json({
          success: false,
          message: 'La observación no puede estar vacía'
        });
        return;
      }

      await ProyectoService.agregarObservacion(proyectoId, observacion, usuario);

      res.status(201).json({
        success: true,
        message: 'Observación agregada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}




