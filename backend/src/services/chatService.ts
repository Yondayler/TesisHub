import { mastra } from '../mastra';
import { UsuarioSinPassword } from '../types';
import { AppError } from '../utils/errors';
import { MensajeModel, Mensaje } from '../models/Mensaje';
import { ConversacionModel, Conversacion } from '../models/Conversacion';
import { crearAgenteTesis, ModoModelo, ProveedorLLM } from '../mastra/agents';

export interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ContextoChat {
  usuario: UsuarioSinPassword;
  proyectoId?: number;
  conversacionId?: number;
  mensajesAnteriores?: MensajeChat[];
  modelo?: ModoModelo;
  provider?: ProveedorLLM;
}

export class ChatService {
  // Generar respuesta del agente usando Mastra
  static async generarRespuesta(
    mensaje: string,
    contexto: ContextoChat
  ): Promise<{ respuesta: string; referencias?: Array<{ titulo: string; autor: string; año: number }>; conversacionId: number }> {
    const modoModelo = contexto.modelo || 'razonamiento';
    const provider = contexto.provider || 'gemini';
    console.log(`📨 [CHAT SERVICE] Provider: ${provider}, Modo: ${modoModelo}`);
    try {
      let conversacionId = contexto.conversacionId;

      // Si no hay conversación, crear una nueva
      if (!conversacionId) {
        const titulo = mensaje.length > 30 ? mensaje.substring(0, 30) + '...' : mensaje;
        const nuevaConversacion = await ConversacionModel.crear({
          usuario_id: contexto.usuario.id,
          proyecto_id: contexto.proyectoId,
          titulo
        });
        conversacionId = nuevaConversacion.id;
      } else {
        // Actualizar fecha de la conversación
        await ConversacionModel.actualizarFecha(conversacionId);
      }

      // Guardar mensaje del usuario
      await MensajeModel.crear({
        usuario_id: contexto.usuario.id,
        proyecto_id: contexto.proyectoId,
        conversacion_id: conversacionId,
        contenido: mensaje,
        rol: 'user'
      });

      // Crear agente con modelo y provider específicos
      console.log(`🔧 [CHAT SERVICE] Creando agente dinámico...`);
      const agente = crearAgenteTesis(modoModelo, provider);

      if (!agente) {
        throw new AppError('El agente de IA no está disponible', 500);
      }

      // Construir historial de mensajes para Mastra
      const historial = (contexto.mensajesAnteriores || []).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Agregar el mensaje actual
      const mensajes = [
        ...historial,
        { role: 'user' as const, content: mensaje }
      ];

      console.log(`🤖 [MASTRA] Generando respuesta con modelo: ${modoModelo}...`);

      // Ejecutar el agente
      const resultado = await agente.generate(mensajes as any);

      const respuestaTexto = resultado.text;

      // Guardar respuesta del asistente
      await MensajeModel.crear({
        usuario_id: contexto.usuario.id,
        proyecto_id: contexto.proyectoId,
        conversacion_id: conversacionId,
        contenido: respuestaTexto,
        rol: 'assistant'
      });

      return {
        respuesta: respuestaTexto,
        referencias: [],
        conversacionId
      };

    } catch (error: any) {
      console.error('Error al generar respuesta con Mastra:', error);
      throw new AppError(
        `Error al generar respuesta: ${error.message || 'Error desconocido'}`,
        500
      );
    }
  }

  // Obtener historial de mensajes
  static async obtenerHistorial(usuarioId: number, proyectoId?: number, conversacionId?: number): Promise<MensajeChat[]> {
    const mensajes = await MensajeModel.obtenerHistorial(usuarioId, proyectoId, conversacionId);

    return mensajes.map(m => ({
      role: m.rol,
      content: m.contenido,
      timestamp: new Date(m.fecha_creacion)
    }));
  }

  // Listar conversaciones
  static async listarConversaciones(usuarioId: number, proyectoId?: number): Promise<Conversacion[]> {
    return await ConversacionModel.listarPorUsuario(usuarioId, proyectoId);
  }

  // Crear nueva conversación vacía
  static async crearConversacion(usuarioId: number, proyectoId?: number): Promise<Conversacion> {
    return await ConversacionModel.crear({
      usuario_id: usuarioId,
      proyecto_id: proyectoId,
      titulo: 'Nueva conversación'
    });
  }

  // Eliminar conversación
  static async eliminarConversacion(id: number): Promise<void> {
    await ConversacionModel.eliminar(id);
  }

  // Obtener sugerencias basadas en el contexto
  static async obtenerSugerencias(contexto: ContextoChat): Promise<string[]> {
    const sugerencias: string[] = [];

    if (contexto.usuario.rol === 'estudiante') {
      sugerencias.push(
        '¿Cómo estructurar el marco teórico de mi tesis?',
        '¿Qué metodología es adecuada para mi proyecto?',
        '¿Cómo redactar los objetivos específicos?',
        '¿Cuál es la estructura de un capítulo de resultados?'
      );
    } else {
      sugerencias.push(
        '¿Qué criterios debo considerar al evaluar esta tesis?',
        '¿Cómo genero comentarios constructivos?',
        '¿Qué tesis similares puedo usar como referencia?'
      );
    }

    return sugerencias;
  }
}