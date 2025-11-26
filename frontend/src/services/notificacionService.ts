import { api } from './api';
import { Notificacion } from '../types';

export const notificacionService = {
  // Obtener notificaciones del usuario
  async obtenerNotificaciones(soloNoLeidas?: boolean): Promise<Notificacion[]> {
    const params = soloNoLeidas ? { leidas: 'false' } : {};
    const response = await api.get('/notificaciones', { params });
    return response.data.data;
  },

  // Contar notificaciones no leídas
  async contarNoLeidas(): Promise<number> {
    const response = await api.get('/notificaciones/no-leidas/count');
    return response.data.data.count;
  },

  // Marcar notificación como leída
  async marcarComoLeida(id: number): Promise<void> {
    await api.patch(`/notificaciones/${id}/leer`);
  },

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas(): Promise<{ marcadas: number }> {
    const response = await api.patch('/notificaciones/marcar-todas-leidas');
    return response.data.data;
  },

  // Eliminar notificación
  async eliminarNotificacion(id: number): Promise<void> {
    await api.delete(`/notificaciones/${id}`);
  },
};






