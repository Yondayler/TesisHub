import { ProyectoModel } from '../models/Proyecto';
import { HistorialProyecto, Proyecto, UsuarioSinPassword } from '../types';
import { AppError } from '../utils/errors';
import { dbRun } from '../config/database';

export class ProyectoService {
  // Crear proyecto
  static async crearProyecto(proyectoData: Proyecto, usuario: UsuarioSinPassword): Promise<Proyecto> {
    // Validar que el usuario sea estudiante o que sea su propio proyecto
    if (usuario.rol === 'estudiante' && proyectoData.estudiante_id !== usuario.id) {
      throw new AppError('No tienes permiso para crear proyectos para otros estudiantes', 403);
    }

    // Si es un nuevo proyecto, inicializar en estado borrador
    if (!proyectoData.estado) {
      proyectoData.estado = 'borrador';
    }

    const proyectoId = await ProyectoModel.crear(proyectoData);
    
    // Registrar en historial
    await this.registrarHistorial(proyectoId, usuario.id, 'creación', undefined, 'borrador', 'Proyecto creado');

    const proyecto = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyecto) {
      throw new AppError('Error al recuperar el proyecto creado', 500);
    }

    return proyecto;
  }

  // Obtener proyectos según el rol del usuario
  static async obtenerProyectos(usuario: UsuarioSinPassword): Promise<Proyecto[]> {
    if (usuario.rol === 'estudiante') {
      return await ProyectoModel.obtenerPorEstudiante(usuario.id);
    } else if (usuario.rol === 'profesor') {
      return await ProyectoModel.obtenerPorTutor(usuario.id);
    } else if (usuario.rol === 'administrador') {
      return await ProyectoModel.obtenerTodos();
    }
    
    return [];
  }

  // Obtener proyecto por ID
  static async obtenerProyectoPorId(id: number, usuario: UsuarioSinPassword): Promise<Proyecto> {
    const proyecto = await ProyectoModel.obtenerPorId(id);
    
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Verificar permisos
    if (usuario.rol === 'estudiante' && proyecto.estudiante_id !== usuario.id) {
      throw new AppError('No tienes permiso para ver este proyecto', 403);
    }
    if (usuario.rol === 'profesor' && proyecto.tutor_id !== usuario.id) {
      throw new AppError('No tienes permiso para ver este proyecto', 403);
    }

    return proyecto;
  }

  // Actualizar proyecto
  static async actualizarProyecto(
    id: number, 
    proyectoData: Partial<Proyecto>, 
    usuario: UsuarioSinPassword
  ): Promise<Proyecto> {
    const proyectoExistente = await ProyectoModel.obtenerPorId(id);
    
    if (!proyectoExistente) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Verificar permisos
    if (usuario.rol === 'estudiante' && proyectoExistente.estudiante_id !== usuario.id) {
      throw new AppError('No tienes permiso para actualizar este proyecto', 403);
    }

    // Los estudiantes solo pueden editar proyectos en estado borrador o corregir
    if (
      usuario.rol === 'estudiante' && 
      proyectoExistente.estado !== 'borrador' && 
      proyectoExistente.estado !== 'corregir'
    ) {
      throw new AppError('No puedes editar un proyecto que ya fue enviado', 400);
    }

    await ProyectoModel.actualizar(id, proyectoData);
    
    // Registrar en historial
    await this.registrarHistorial(
      id, 
      usuario.id, 
      'actualización', 
      undefined, 
      undefined, 
      'Proyecto actualizado'
    );

    const proyectoActualizado = await ProyectoModel.obtenerPorId(id);
    if (!proyectoActualizado) {
      throw new AppError('Error al recuperar el proyecto actualizado', 500);
    }

    return proyectoActualizado;
  }

  // Cambiar estado del proyecto
  static async cambiarEstado(
    id: number, 
    nuevoEstado: string, 
    observaciones: string | undefined,
    usuario: UsuarioSinPassword
  ): Promise<Proyecto> {
    const proyecto = await ProyectoModel.obtenerPorId(id);
    
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Validar transiciones de estado según rol
    this.validarTransicionEstado(proyecto, nuevoEstado, usuario);

    const estadoAnterior = proyecto.estado;
    await ProyectoModel.actualizarEstado(id, nuevoEstado, observaciones);
    
    // Registrar en historial
    await this.registrarHistorial(
      id, 
      usuario.id, 
      'cambio_estado', 
      estadoAnterior, 
      nuevoEstado, 
      observaciones || `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`
    );

    const proyectoActualizado = await ProyectoModel.obtenerPorId(id);
    if (!proyectoActualizado) {
      throw new AppError('Error al recuperar el proyecto actualizado', 500);
    }

    return proyectoActualizado;
  }

  // Eliminar proyecto
  static async eliminarProyecto(id: number, usuario: UsuarioSinPassword): Promise<void> {
    const proyecto = await ProyectoModel.obtenerPorId(id);
    
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Solo el estudiante dueño o un administrador pueden eliminar
    if (usuario.rol === 'estudiante' && proyecto.estudiante_id !== usuario.id) {
      throw new AppError('No tienes permiso para eliminar este proyecto', 403);
    }
    if (usuario.rol === 'profesor') {
      throw new AppError('Los profesores no pueden eliminar proyectos', 403);
    }

    // Solo se pueden eliminar proyectos en borrador
    if (proyecto.estado !== 'borrador') {
      throw new AppError('Solo se pueden eliminar proyectos en estado borrador', 400);
    }

    await ProyectoModel.eliminar(id);
  }

  // Obtener estadísticas del estudiante
  static async obtenerEstadisticas(usuario: UsuarioSinPassword): Promise<any> {
    if (usuario.rol === 'estudiante') {
      return await ProyectoModel.contarPorEstudiante(usuario.id);
    }
    
    // Para otros roles, retornar estadísticas generales
    return {
      total: 0,
      borradores: 0,
      enviados: 0,
      en_revision: 0,
      aprobados: 0,
      rechazados: 0,
      corregir: 0
    };
  }

  // Validar transición de estado
  private static validarTransicionEstado(
    proyecto: Proyecto, 
    nuevoEstado: string, 
    usuario: UsuarioSinPassword
  ): void {
    const estadoActual = proyecto.estado;

    // Estudiantes solo pueden: borrador -> enviado, corregir -> enviado
    if (usuario.rol === 'estudiante') {
      if (estadoActual === 'borrador' && nuevoEstado === 'enviado') return;
      if (estadoActual === 'corregir' && nuevoEstado === 'enviado') return;
      throw new AppError(`No puedes cambiar el estado de ${estadoActual} a ${nuevoEstado}`, 400);
    }

    // Profesores pueden: enviado -> en_revision, en_revision -> aprobado/rechazado/corregir
    if (usuario.rol === 'profesor') {
      if (proyecto.tutor_id !== usuario.id) {
        throw new AppError('No eres el tutor asignado a este proyecto', 403);
      }
      if (estadoActual === 'enviado' && nuevoEstado === 'en_revision') return;
      if (estadoActual === 'en_revision' && ['aprobado', 'rechazado', 'corregir'].includes(nuevoEstado)) return;
      throw new AppError(`No puedes cambiar el estado de ${estadoActual} a ${nuevoEstado}`, 400);
    }

    // Administradores pueden hacer cualquier cambio
    if (usuario.rol === 'administrador') {
      return;
    }
  }

  // Registrar en historial
  private static async registrarHistorial(
    proyectoId: number,
    usuarioId: number,
    accion: string,
    estadoAnterior?: string,
    estadoNuevo?: string,
    descripcion?: string
  ): Promise<void> {
    const sql = `
      INSERT INTO historial_proyectos (
        proyecto_id, usuario_id, accion, estado_anterior, estado_nuevo, descripcion
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await dbRun(sql, [
      proyectoId,
      usuarioId,
      accion,
      estadoAnterior || null,
      estadoNuevo || null,
      descripcion || null
    ]);
  }
}


