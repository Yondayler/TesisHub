import { Response, NextFunction } from 'express';
import { ChatService, ContextoChat, MensajeChat } from '../services/chatService';
import { AuthRequest } from '../types';

export class ChatController {
  // POST /api/chat/mensaje - Enviar mensaje al agente
  static async enviarMensaje(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const { mensaje, proyectoId, mensajesAnteriores, conversacionId, modelo, provider } = req.body;

      console.log(`📥 [CONTROLLER] Mensaje recibido. Provider: ${provider || 'gemini'}, Modelo: ${modelo || 'razonamiento'}`);

      if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'El mensaje es requerido y no puede estar vacío'
        });
      }

      // Validar longitud del mensaje
      if (mensaje.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'El mensaje es demasiado largo (máximo 5000 caracteres)'
        });
      }

      // Validar modelo si se proporciona
      if (modelo && modelo !== 'rapido' && modelo !== 'razonamiento') {
        return res.status(400).json({
          success: false,
          error: 'El modelo debe ser "rapido" o "razonamiento"'
        });
      }

      // Validar provider si se proporciona
      if (provider && provider !== 'gemini' && provider !== 'groq') {
        return res.status(400).json({
          success: false,
          error: 'El provider debe ser "gemini" o "groq"'
        });
      }

      // Construir contexto
      const contexto: ContextoChat = {
        usuario,
        proyectoId: proyectoId ? parseInt(proyectoId) : undefined,
        conversacionId: conversacionId ? parseInt(conversacionId) : undefined,
        mensajesAnteriores: mensajesAnteriores || [],
        modelo: modelo || 'razonamiento',
        provider: provider || 'gemini'
      };

      // Generar respuesta
      const resultado = await ChatService.generarRespuesta(mensaje.trim(), contexto);

      res.json({
        success: true,
        data: {
          respuesta: resultado.respuesta,
          referencias: resultado.referencias || [],
          conversacionId: resultado.conversacionId
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/chat/historial - Obtener historial de mensajes
  static async obtenerHistorial(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const { proyectoId, conversacionId } = req.query;

      const historial = await ChatService.obtenerHistorial(
        usuario.id,
        proyectoId ? parseInt(proyectoId as string) : undefined,
        conversacionId ? parseInt(conversacionId as string) : undefined
      );

      res.json({
        success: true,
        data: historial
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/chat/conversaciones - Listar conversaciones
  static async listarConversaciones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const { proyectoId } = req.query;

      const conversaciones = await ChatService.listarConversaciones(
        usuario.id,
        proyectoId ? parseInt(proyectoId as string) : undefined
      );

      res.json({
        success: true,
        data: conversaciones
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/chat/conversaciones - Crear nueva conversación
  static async crearConversacion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const { proyectoId } = req.body;

      const conversacion = await ChatService.crearConversacion(
        usuario.id,
        proyectoId ? parseInt(proyectoId) : undefined
      );

      res.json({
        success: true,
        data: conversacion
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/chat/conversaciones/:id - Eliminar conversación
  static async eliminarConversacion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ChatService.eliminarConversacion(parseInt(id));

      res.json({
        success: true,
        message: 'Conversación eliminada'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/chat/sugerencias - Obtener sugerencias de preguntas
  static async obtenerSugerencias(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const { proyectoId } = req.query;

      const contexto: ContextoChat = {
        usuario,
        proyectoId: proyectoId ? parseInt(proyectoId as string) : undefined
      };

      const sugerencias = await ChatService.obtenerSugerencias(contexto);

      res.json({
        success: true,
        data: sugerencias
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/chat/upload - Subir archivo
  static async subirArchivo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const usuario = req.usuario!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
      }

      // Importar utilidad de procesamiento
      const { extractTextFromFile, truncateText } = await import('../utils/fileProcessor');

      console.log('📄 [UPLOAD] Intentando extraer texto del archivo:');
      console.log('   - Nombre:', file.originalname);
      console.log('   - Ruta:', file.path);
      console.log('   - Mimetype:', file.mimetype);
      console.log('   - Tamaño:', file.size, 'bytes');

      // Extraer texto del archivo
      let extractedText = '';
      try {
        console.log('🔍 [UPLOAD] Iniciando extracción de texto...');
        const fullText = await extractTextFromFile(file.path, file.mimetype);
        console.log('✅ [UPLOAD] Texto extraído exitosamente. Longitud:', fullText.length, 'caracteres');
        console.log('📝 [UPLOAD] Primeros 200 caracteres:', fullText.substring(0, 200));
        extractedText = truncateText(fullText, 10000); // Limitar a 10k caracteres
        console.log('✂️ [UPLOAD] Texto truncado a:', extractedText.length, 'caracteres');
      } catch (error) {
        console.error('❌ [UPLOAD] Error extrayendo texto:', error);
        console.error('   - Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('   - Error stack:', error instanceof Error ? error.stack : 'No stack');
        extractedText = '[No se pudo extraer el texto del archivo]';
      }

      // Retornar información del archivo subido + texto extraído
      res.json({
        success: true,
        data: {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          extractedText: extractedText
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

