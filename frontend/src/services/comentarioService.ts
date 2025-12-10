import { api } from './api';

export interface Comentario {
  id?: number;
  proyecto_id: number;
  usuario_id: number;
  comentario: string;
  tipo_comentario: 'general' | 'correccion' | 'pregunta' | 'respuesta';
  comentario_padre_id?: number;
  fecha_comentario?: string;
  editado: number;
  fecha_edicion?: string;
  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_rol?: string;
  respuestas?: Comentario[];
}

export interface CrearComentarioRequest {
  proyecto_id: number;
  comentario: string;
  tipo_comentario?: 'general' | 'correccion' | 'pregunta' | 'respuesta';
  comentario_padre_id?: number;
}

export const comentarioService = {
  // Crear comentario
  async crearComentario(data: CrearComentarioRequest): Promise<Comentario> {
    const response = await api.post('/comentarios', data);
    return response.data.data;
  },

  // Obtener comentarios por proyecto
  async obtenerComentariosPorProyecto(proyectoId: number): Promise<Comentario[]> {
    const response = await api.get(`/comentarios/proyecto/${proyectoId}`);
    return response.data.data;
  },

  // Actualizar comentario
  async actualizarComentario(id: number, comentario: string): Promise<Comentario> {
    const response = await api.put(`/comentarios/${id}`, { comentario });
    return response.data.data;
  },

  // Eliminar comentario
  async eliminarComentario(id: number): Promise<void> {
    await api.delete(`/comentarios/${id}`);
  },
};




