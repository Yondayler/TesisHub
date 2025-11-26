import { api } from './api';
import { Proyecto, EstadisticasProyecto, ObservacionProyecto } from '../types';

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

  // Obtener proyectos de un estudiante específico (solo administradores)
  async obtenerProyectosPorEstudiante(estudianteId: number): Promise<Proyecto[]> {
    const response = await api.get(`/proyectos/estudiante/${estudianteId}`);
    return response.data.data;
  },

  // Asignar tutor a un proyecto (solo administradores)
  async asignarTutor(proyectoId: number, tutorId: number): Promise<Proyecto> {
    const response = await api.patch(`/proyectos/${proyectoId}/asignar-tutor`, { tutor_id: tutorId });
    return response.data.data;
  },

  // Remover tutor de un proyecto (solo administradores)
  async removerTutor(proyectoId: number): Promise<Proyecto> {
    const response = await api.patch(`/proyectos/${proyectoId}/remover-tutor`);
    return response.data.data;
  },

  // Obtener todas las observaciones de un proyecto
  async obtenerObservaciones(proyectoId: number): Promise<ObservacionProyecto[]> {
    const response = await api.get(`/proyectos/${proyectoId}/observaciones`);
    return response.data.data;
  },

  // Agregar una observación a un proyecto
  async agregarObservacion(proyectoId: number, observacion: string): Promise<void> {
    await api.post(`/proyectos/${proyectoId}/observaciones`, { observacion });
  },

  // Obtener datos para gráfico por fecha (solo administradores)
  async obtenerDatosGrafico(dias: number = 90): Promise<any[]> {
    const response = await api.get(`/proyectos/grafico?dias=${dias}`);
    return response.data.data;
  },
};
