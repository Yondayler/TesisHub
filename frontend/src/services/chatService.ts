import { api } from './api';
import { ApiResponse } from '../types';

export interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversacion {
  id: number;
  titulo: string;
  fecha_actualizacion: string;
}

export interface RespuestaChat {
  respuesta: string;
  referencias?: Array<{
    titulo: string;
    autor: string;
    año: number;
  }>;
  conversacionId: number;
}

export const chatService = {
  // Enviar mensaje al agente
  async enviarMensaje(
    mensaje: string,
    proyectoId?: number,
    mensajesAnteriores?: Array<{ role: string; content: string }>,
    conversacionId?: number,
    signal?: AbortSignal,
    modelo?: 'rapido' | 'razonamiento',
    provider?: 'gemini' | 'groq'
  ): Promise<RespuestaChat> {
    const response = await api.post<ApiResponse<RespuestaChat>>('/chat/mensaje', {
      mensaje,
      proyectoId,
      mensajesAnteriores,
      conversacionId,
      modelo,
      provider
    }, { signal });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al enviar mensaje');
    }

    return response.data.data;
  },

  // Obtener historial de mensajes
  async obtenerHistorial(proyectoId?: number, conversacionId?: number): Promise<MensajeChat[]> {
    const response = await api.get<ApiResponse<MensajeChat[]>>('/chat/historial', {
      params: { proyectoId, conversacionId }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener historial');
    }

    return response.data.data;
  },

  // Listar conversaciones
  async listarConversaciones(proyectoId?: number): Promise<Conversacion[]> {
    const response = await api.get<ApiResponse<Conversacion[]>>('/chat/conversaciones', {
      params: { proyectoId }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al listar conversaciones');
    }

    return response.data.data;
  },

  // Crear nueva conversación
  async crearConversacion(proyectoId?: number): Promise<Conversacion> {
    const response = await api.post<ApiResponse<Conversacion>>('/chat/conversaciones', {
      proyectoId
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al crear conversación');
    }

    return response.data.data;
  },

  // Eliminar conversación
  async eliminarConversacion(id: number): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/chat/conversaciones/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al eliminar conversación');
    }
  },

  // Obtener sugerencias de preguntas
  async obtenerSugerencias(proyectoId?: number): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/chat/sugerencias', {
      params: { proyectoId }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al obtener sugerencias');
    }

    return response.data.data;
  },

  // Subir archivo
  async subirArchivo(formData: FormData): Promise<{
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
    extractedText: string;
  }> {
    const response = await api.post<ApiResponse<{
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
      path: string;
      extractedText: string;
    }>>('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Error al subir archivo');
    }

    return response.data.data;
  }
};

