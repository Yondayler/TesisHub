import { ComentarioModel } from '../models/Comentario';
import { Comentario, UsuarioSinPassword } from '../types';
import { AppError } from '../utils/errors';
import { ProyectoModel } from '../models/Proyecto';

export class ComentarioService {
  // Crear comentario
  static async crearComentario(
    comentarioData: Omit<Comentario, 'id' | 'fecha_comentario' | 'editado'>,
    usuario: UsuarioSinPassword
  ): Promise<any> {
    // Verificar que el proyecto existe
    const proyecto = await ProyectoModel.obtenerPorId(comentarioData.proyecto_id);
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Verificar permisos: solo estudiante del proyecto o tutor asignado
    if (usuario.rol === 'estudiante' && proyecto.estudiante_id !== usuario.id) {
      throw new AppError('No tienes permiso para comentar en este proyecto', 403);
    }

    if (usuario.rol === 'tutor' && proyecto.tutor_id !== usuario.id) {
      throw new AppError('No tienes permiso para comentar en este proyecto', 403);
    }

    const comentarioId = await ComentarioModel.crear({
      ...comentarioData,
      usuario_id: usuario.id
    });

    const comentario = await ComentarioModel.obtenerPorId(comentarioId);
    if (!comentario) {
      throw new AppError('Error al crear el comentario', 500);
    }

    return comentario;
  }

  // Obtener comentarios por proyecto
  static async obtenerComentariosPorProyecto(
    proyectoId: number,
    usuario: UsuarioSinPassword
  ): Promise<any[]> {
    // Verificar que el proyecto existe
    const proyecto = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyecto) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Verificar permisos
    if (usuario.rol === 'estudiante' && proyecto.estudiante_id !== usuario.id) {
      throw new AppError('No tienes permiso para ver los comentarios de este proyecto', 403);
    }

    if (usuario.rol === 'tutor' && proyecto.tutor_id !== usuario.id) {
      throw new AppError('No tienes permiso para ver los comentarios de este proyecto', 403);
    }

    const comentarios = await ComentarioModel.obtenerPorProyecto(proyectoId);
    
    // Obtener respuestas para cada comentario
    const comentariosConRespuestas = await Promise.all(
      comentarios.map(async (comentario) => {
        const respuestas = await ComentarioModel.obtenerRespuestas(comentario.id!);
        return {
          ...comentario,
          respuestas
        };
      })
    );

    return comentariosConRespuestas;
  }

  // Actualizar comentario
  static async actualizarComentario(
    comentarioId: number,
    nuevoComentario: string,
    usuario: UsuarioSinPassword
  ): Promise<any> {
    const comentario = await ComentarioModel.obtenerPorId(comentarioId);
    if (!comentario) {
      throw new AppError('Comentario no encontrado', 404);
    }

    // Solo el autor puede editar
    if (comentario.usuario_id !== usuario.id) {
      throw new AppError('No tienes permiso para editar este comentario', 403);
    }

    await ComentarioModel.actualizar(comentarioId, nuevoComentario);
    return await ComentarioModel.obtenerPorId(comentarioId);
  }

  // Eliminar comentario
  static async eliminarComentario(
    comentarioId: number,
    usuario: UsuarioSinPassword
  ): Promise<void> {
    const comentario = await ComentarioModel.obtenerPorId(comentarioId);
    if (!comentario) {
      throw new AppError('Comentario no encontrado', 404);
    }

    // Solo el autor puede eliminar
    if (comentario.usuario_id !== usuario.id) {
      throw new AppError('No tienes permiso para eliminar este comentario', 403);
    }

    const eliminado = await ComentarioModel.eliminar(comentarioId);
    if (!eliminado) {
      throw new AppError('Error al eliminar el comentario', 500);
    }
  }
}

