import { NotificacionModel } from '../models/Notificacion';
import { Notificacion, UsuarioSinPassword } from '../types';
import { AppError } from '../utils/errors';

export class NotificacionService {
  // Crear notificación
  static async crearNotificacion(notificacion: Notificacion): Promise<number> {
    return await NotificacionModel.crear(notificacion);
  }

  // Obtener notificaciones de un usuario
  static async obtenerNotificacionesUsuario(
    usuarioId: number,
    soloNoLeidas: boolean = false
  ): Promise<Notificacion[]> {
    return await NotificacionModel.obtenerPorUsuario(usuarioId, soloNoLeidas);
  }

  // Marcar notificación como leída
  static async marcarComoLeida(id: number, usuarioId: number): Promise<void> {
    const cambios = await NotificacionModel.marcarComoLeida(id, usuarioId);
    if (cambios === 0) {
      throw new AppError('Notificación no encontrada o no pertenece al usuario', 404);
    }
  }

  // Marcar todas las notificaciones como leídas
  static async marcarTodasComoLeidas(usuarioId: number): Promise<number> {
    return await NotificacionModel.marcarTodasComoLeidas(usuarioId);
  }

  // Contar notificaciones no leídas
  static async contarNoLeidas(usuarioId: number): Promise<number> {
    return await NotificacionModel.contarNoLeidas(usuarioId);
  }

  // Eliminar notificación
  static async eliminarNotificacion(id: number, usuarioId: number): Promise<void> {
    const cambios = await NotificacionModel.eliminar(id, usuarioId);
    if (cambios === 0) {
      throw new AppError('Notificación no encontrada o no pertenece al usuario', 404);
    }
  }

  // Crear notificación de asignación de tutor
  static async crearNotificacionAsignacionTutor(
    estudianteId: number,
    proyectoId: number,
    tutorNombre: string,
    proyectoTitulo: string
  ): Promise<number> {
    const notificacion: Notificacion = {
      usuario_id: estudianteId,
      proyecto_id: proyectoId,
      tipo_notificacion: 'asignacion',
      titulo: 'Tutor Asignado',
      mensaje: `Se te ha asignado el tutor ${tutorNombre} para tu proyecto "${proyectoTitulo}".`,
      leida: 0,
    };

    return await this.crearNotificacion(notificacion);
  }

  // Crear notificación de cambio de estado
  static async crearNotificacionCambioEstado(
    estudianteId: number,
    proyectoId: number,
    proyectoTitulo: string,
    estadoAnterior: string,
    estadoNuevo: string,
    observaciones?: string
  ): Promise<number> {
    const titulo = this.obtenerTituloPorEstado(estadoNuevo);
    let mensaje = `Tu proyecto "${proyectoTitulo}" ha cambiado de estado de "${this.formatearEstado(estadoAnterior)}" a "${this.formatearEstado(estadoNuevo)}".`;
    
    // Agregar información sobre observaciones si existen
    if (observaciones && observaciones.trim()) {
      mensaje += ` Revisa las observaciones en la sección correspondiente.`;
    }

    const notificacion: Notificacion = {
      usuario_id: estudianteId,
      proyecto_id: proyectoId,
      tipo_notificacion: this.obtenerTipoPorEstado(estadoNuevo),
      titulo,
      mensaje,
      leida: 0,
    };

    return await this.crearNotificacion(notificacion);
  }

  // Formatear estado para mostrar en notificaciones
  private static formatearEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'borrador': 'Borrador',
      'enviado': 'Enviado',
      'en_revision': 'En Revisión',
      'aprobado': 'Aprobado',
      'rechazado': 'Rechazado',
      'corregir': 'Por Corregir'
    };
    return estados[estado] || estado;
  }

  // Métodos auxiliares
  private static obtenerTituloPorEstado(estado: string): string {
    switch (estado) {
      case 'en_revision':
        return 'Proyecto en Revisión';
      case 'aprobado':
        return 'Proyecto Aprobado';
      case 'rechazado':
        return 'Proyecto Rechazado';
      case 'corregir':
        return 'Proyecto Requiere Correcciones';
      default:
        return 'Cambio en Proyecto';
    }
  }

  private static obtenerTipoPorEstado(estado: string): 'revision' | 'aprobacion' | 'rechazo' | 'comentario' | 'asignacion' {
    switch (estado) {
      case 'en_revision':
        return 'revision';
      case 'aprobado':
        return 'aprobacion';
      case 'rechazado':
        return 'rechazo';
      case 'corregir':
        return 'revision';
      default:
        return 'revision';
    }
  }
}





