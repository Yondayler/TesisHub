import { api } from './api';
import { Proyecto, EstadisticasProyecto } from '../types';

export const proyectoService = {
  // Obtener todos los proyectos del usuario
  async obtenerProyectos(): Promise<Proyecto[]> {
    const response = await api.get('/proyectos');
    return response.data.data;
  },

  // Obtener estadísticas
  async obtenerEstadisticas(): Promise<EstadisticasProyecto> {
    const response = await api.get('/proyectos/estadisticas');
    return response.data.data;
  },

  // Obtener un proyecto por ID
  async obtenerProyecto(id: number): Promise<Proyecto> {
    const response = await api.get(`/proyectos/${id}`);
    return response.data.data;
  },

  // Crear un nuevo proyecto
  async crearProyecto(proyecto: Partial<Proyecto>): Promise<Proyecto> {
    const response = await api.post('/proyectos', proyecto);
    return response.data.data;
  },

  // Actualizar un proyecto
  async actualizarProyecto(id: number, proyecto: Partial<Proyecto>): Promise<Proyecto> {
    const response = await api.put(`/proyectos/${id}`, proyecto);
    return response.data.data;
  },

  // Cambiar estado de un proyecto
  async cambiarEstado(id: number, estado: string, observaciones?: string): Promise<Proyecto> {
    const response = await api.patch(`/proyectos/${id}/estado`, { estado, observaciones });
    return response.data.data;
  },

  // Eliminar un proyecto
  async eliminarProyecto(id: number): Promise<void> {
    await api.delete(`/proyectos/${id}`);
  },
};


