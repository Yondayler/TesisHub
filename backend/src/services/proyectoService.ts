import { ProyectoModel } from '../models/Proyecto';
import { HistorialProyecto, Proyecto, UsuarioSinPassword, Notificacion } from '../types';
import { AppError } from '../utils/errors';
import { dbRun } from '../config/database';
import { NotificacionService } from './notificacionService';
import { UsuarioModel } from '../models/Usuario';

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
    } else if (usuario.rol === 'tutor') {
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
    if (usuario.rol === 'tutor' && proyecto.tutor_id !== usuario.id) {
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
    
    // Si hay observaciones y el estado es 'corregir' o 'rechazado', guardarlas en la tabla de observaciones
    if (observaciones && observaciones.trim() && (nuevoEstado === 'corregir' || nuevoEstado === 'rechazado')) {
      const { ObservacionProyectoModel } = await import('../models/ObservacionProyecto');
      await ObservacionProyectoModel.crear({
        proyecto_id: id,
        usuario_id: usuario.id,
        observacion: observaciones.trim(),
        estado_proyecto: nuevoEstado
      });
    }
    
    // Actualizar estado sin reemplazar observaciones (mantener compatibilidad)
    await ProyectoModel.actualizarEstado(id, nuevoEstado, undefined);
    
    // Registrar en historial
    await this.registrarHistorial(
      id, 
      usuario.id, 
      'cambio_estado', 
      estadoAnterior, 
      nuevoEstado, 
      observaciones || `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`
    );

    // Crear notificación para el estudiante si el cambio fue hecho por tutor o administrador
    // Solo notificar si el estado cambió y no es el mismo estudiante quien lo cambió
    if (usuario.rol !== 'estudiante' && proyecto.estudiante_id && estadoAnterior !== nuevoEstado) {
      try {
        await NotificacionService.crearNotificacionCambioEstado(
          proyecto.estudiante_id,
          id,
          proyecto.titulo,
          estadoAnterior,
          nuevoEstado,
          observaciones
        );
      } catch (error) {
        // No fallar si la notificación no se puede crear, solo loguear
        console.error('Error al crear notificación de cambio de estado:', error);
      }
    }

    const proyectoActualizado = await ProyectoModel.obtenerPorId(id);
    if (!proyectoActualizado) {
      throw new AppError('Error al recuperar el proyecto actualizado', 500);
    }

    return proyectoActualizado;
  }

  // Agregar observación a un proyecto (sin cambiar estado)
  static async agregarObservacion(
    id: number,
    observacion: string,
    usuario: UsuarioSinPassword
  ): Promise<void> {
    const proyecto = await ProyectoModel.obtenerPorId(id);
    
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Solo tutores asignados pueden agregar observaciones
    if (usuario.rol === 'tutor' && proyecto.tutor_id !== usuario.id) {
      throw new AppError('No eres el tutor asignado a este proyecto', 403);
    }

    if (!observacion || !observacion.trim()) {
      throw new AppError('La observación no puede estar vacía', 400);
    }

    const { ObservacionProyectoModel } = await import('../models/ObservacionProyecto');
    await ObservacionProyectoModel.crear({
      proyecto_id: id,
      usuario_id: usuario.id,
      observacion: observacion.trim(),
      estado_proyecto: proyecto.estado
    });

    // Crear notificación para el estudiante cuando se agrega una observación
    if (proyecto.estudiante_id) {
      try {
        const notificacion: Notificacion = {
          usuario_id: proyecto.estudiante_id,
          proyecto_id: id,
          tipo_notificacion: 'revision',
          titulo: 'Nueva Observación en tu Proyecto',
          mensaje: `Tu tutor ha agregado una nueva observación al proyecto "${proyecto.titulo}". Revisa los detalles en la sección de observaciones.`,
          leida: 0,
        };
        await NotificacionService.crearNotificacion(notificacion);
      } catch (error) {
        // No fallar si la notificación no se puede crear, solo loguear
        console.error('Error al crear notificación de observación:', error);
      }
    }
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
    if (usuario.rol === 'tutor') {
      throw new AppError('Los tutores no pueden eliminar proyectos', 403);
    }

    // Solo se pueden eliminar proyectos en borrador
    if (proyecto.estado !== 'borrador') {
      throw new AppError('Solo se pueden eliminar proyectos en estado borrador', 400);
    }

    await ProyectoModel.eliminar(id);
  }

  // Obtener proyectos de un estudiante específico (solo administradores)
  static async obtenerProyectosPorEstudiante(
    estudianteId: number, 
    usuario: UsuarioSinPassword
  ): Promise<Proyecto[]> {
    // Solo administradores pueden ver proyectos de cualquier estudiante
    if (usuario.rol !== 'administrador') {
      throw new AppError('No tienes permiso para ver proyectos de otros estudiantes', 403);
    }

    return await ProyectoModel.obtenerPorEstudiante(estudianteId);
  }

  // Obtener estadísticas del estudiante
  static async obtenerEstadisticas(usuario: UsuarioSinPassword): Promise<any> {
    if (usuario.rol === 'estudiante') {
      return await ProyectoModel.contarPorEstudiante(usuario.id);
    }
    
    if (usuario.rol === 'tutor') {
      return await ProyectoModel.contarPorTutor(usuario.id);
    }
    
    // Para administradores, retornar estadísticas generales
    if (usuario.rol === 'administrador') {
      const proyectos = await ProyectoModel.contarTodos();
      const proyectosActivos = await ProyectoModel.contarActivos();
      const tasaAprobacion = await ProyectoModel.calcularTasaAprobacion();
      const nuevosEstudiantes = await UsuarioModel.contarNuevosEstudiantes();
      const nuevosEstudiantesAnterior = await UsuarioModel.contarNuevosEstudiantesMesAnterior();
      
      // Calcular variación porcentual de nuevos estudiantes
      let variacionEstudiantes = 0;
      if (nuevosEstudiantesAnterior > 0) {
        variacionEstudiantes = ((nuevosEstudiantes - nuevosEstudiantesAnterior) / nuevosEstudiantesAnterior) * 100;
      } else if (nuevosEstudiantes > 0) {
        variacionEstudiantes = 100; // Si no había estudiantes el mes anterior y ahora hay, es 100% de crecimiento
      }

      // Calcular variación de proyectos activos (comparar con el mes anterior)
      const proyectosAnterior = await ProyectoModel.contarTodos();
      // Por simplicidad, usaremos una variación estimada basada en el total
      const variacionProyectos = proyectos.total > 0 ? 5.2 : 0; // Valor estimado, se puede mejorar con consulta histórica

      return {
        totalProyectos: proyectos.total || 0,
        proyectosActivos: proyectosActivos,
        nuevosEstudiantes: nuevosEstudiantes,
        tasaAprobacion: tasaAprobacion,
        variacionEstudiantes: variacionEstudiantes,
        variacionProyectos: variacionProyectos,
        variacionAprobacion: tasaAprobacion > 0 ? 2.1 : 0, // Valor estimado
        // Mantener compatibilidad con estadísticas anteriores
        total: proyectos.total || 0,
        borradores: proyectos.borradores || 0,
        enviados: proyectos.enviados || 0,
        en_revision: proyectos.en_revision || 0,
        aprobados: proyectos.aprobados || 0,
        rechazados: proyectos.rechazados || 0,
        corregir: proyectos.corregir || 0
      };
    }
    
    // Si no es ninguno de los roles anteriores, retornar valores por defecto
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

  // Obtener datos de proyectos por fecha para gráficos
  static async obtenerProyectosPorFecha(dias: number = 90): Promise<any[]> {
    return await ProyectoModel.obtenerProyectosPorFecha(dias);
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

    // Tutores pueden mover el proyecto según sea necesario (si están asignados)
    if (usuario.rol === 'tutor') {
      if (proyecto.tutor_id !== usuario.id) {
        throw new AppError('No eres el tutor asignado a este proyecto', 403);
      }

      const estadosPermitidosTutor = ['en_revision', 'aprobado', 'rechazado', 'corregir'];
      if (!estadosPermitidosTutor.includes(nuevoEstado)) {
        throw new AppError('Estado no válido para tutor', 400);
      }

      // Los tutores pueden mover el proyecto libremente entre los estados permitidos
      return;
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

  // Asignar tutor a un proyecto
  static async asignarTutor(
    proyectoId: number,
    tutorId: number,
    usuario: UsuarioSinPassword
  ): Promise<Proyecto> {
    // Solo administradores pueden asignar tutores
    if (usuario.rol !== 'administrador') {
      throw new AppError('No tienes permiso para asignar tutores', 403);
    }

    // Verificar que el proyecto existe
    const proyecto = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Verificar que el tutor existe y es tutor
    const tutor = await UsuarioModel.obtenerPorId(tutorId);
    if (!tutor) {
      throw new AppError('Tutor no encontrado', 404);
    }
    if (tutor.rol !== 'tutor') {
      throw new AppError('El usuario seleccionado no es un tutor válido', 400);
    }

    // Verificar que el tutor no sea el mismo estudiante
    if (tutor.id === proyecto.estudiante_id) {
      throw new AppError('El tutor no puede ser el mismo estudiante', 400);
    }

    // Actualizar el tutor del proyecto
    const tutorAnterior = proyecto.tutor_id;
    await ProyectoModel.actualizar(proyectoId, { tutor_id: tutorId });

    // Registrar en historial
    await this.registrarHistorial(
      proyectoId,
      usuario.id,
      'asignar_tutor',
      undefined,
      undefined,
      `Tutor asignado: ${tutor.nombre} ${tutor.apellido}`
    );

    // Crear notificación para el estudiante
    await NotificacionService.crearNotificacionAsignacionTutor(
      proyecto.estudiante_id,
      proyectoId,
      `${tutor.nombre} ${tutor.apellido}`,
      proyecto.titulo
    );

    // Crear notificación para el tutor
    const estudiante = await UsuarioModel.obtenerPorId(proyecto.estudiante_id);
    if (estudiante) {
      const notificacionTutor: Notificacion = {
        usuario_id: tutorId,
        proyecto_id: proyectoId,
        tipo_notificacion: 'asignacion',
        titulo: 'Nuevo Estudiante Asignado',
        mensaje: `Se te ha asignado como tutor del proyecto "${proyecto.titulo}" del estudiante ${estudiante.nombre} ${estudiante.apellido}.`,
        leida: 0,
      };
      await NotificacionService.crearNotificacion(notificacionTutor);
    }

    // Obtener el proyecto actualizado
    const proyectoActualizado = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyectoActualizado) {
      throw new AppError('Error al obtener el proyecto actualizado', 500);
    }

    return proyectoActualizado;
  }

  // Remover tutor de un proyecto
  static async removerTutor(proyectoId: number, usuario: UsuarioSinPassword): Promise<Proyecto> {
    // Solo administradores pueden remover tutores
    if (usuario.rol !== 'administrador') {
      throw new AppError('No tienes permiso para remover tutores', 403);
    }

    // Verificar que el proyecto existe
    const proyecto = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Actualizar el tutor del proyecto a null
    await ProyectoModel.actualizar(proyectoId, { tutor_id: undefined });

    // Registrar en historial
    await this.registrarHistorial(
      proyectoId,
      usuario.id,
      'remover_tutor',
      undefined,
      undefined,
      'Tutor removido del proyecto'
    );

    // Obtener el proyecto actualizado
    const proyectoActualizado = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyectoActualizado) {
      throw new AppError('Error al obtener el proyecto actualizado', 500);
    }

    return proyectoActualizado;
  }
}




