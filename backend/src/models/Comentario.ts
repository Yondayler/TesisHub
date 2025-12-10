import { query } from '../config/database';
import { Comentario } from '../types';

export class ComentarioModel {
  // Crear comentario
  static async crear(comentario: Omit<Comentario, 'id' | 'fecha_comentario'>): Promise<number> {
    const result = await query.run(
      `INSERT INTO comentarios (proyecto_id, usuario_id, comentario, tipo_comentario, comentario_padre_id, editado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        comentario.proyecto_id,
        comentario.usuario_id,
        comentario.comentario,
        comentario.tipo_comentario || 'general',
        comentario.comentario_padre_id || null,
        0
      ]
    );

    return result.lastID;
  }

  // Obtener comentario por ID
  static async obtenerPorId(id: number): Promise<Comentario | null> {
    const comentario = await query.get(
      `SELECT c.*, 
              u.nombre as usuario_nombre, 
              u.apellido as usuario_apellido,
              u.rol as usuario_rol
       FROM comentarios c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [id]
    ) as any;

    if (!comentario) return null;

    return {
      id: comentario.id,
      proyecto_id: comentario.proyecto_id,
      usuario_id: comentario.usuario_id,
      comentario: comentario.comentario,
      tipo_comentario: comentario.tipo_comentario,
      comentario_padre_id: comentario.comentario_padre_id,
      fecha_comentario: comentario.fecha_comentario,
      editado: comentario.editado,
      fecha_edicion: comentario.fecha_edicion,
      usuario_nombre: comentario.usuario_nombre,
      usuario_apellido: comentario.usuario_apellido,
      usuario_rol: comentario.usuario_rol
    };
  }

  // Obtener comentarios por proyecto
  static async obtenerPorProyecto(proyectoId: number): Promise<any[]> {
    const comentarios = await query.all(
      `SELECT c.*, 
              u.nombre as usuario_nombre, 
              u.apellido as usuario_apellido,
              u.rol as usuario_rol
       FROM comentarios c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.proyecto_id = ? AND c.comentario_padre_id IS NULL
       ORDER BY c.fecha_comentario ASC`,
      [proyectoId]
    ) as any[];

    return comentarios.map(c => ({
      id: c.id,
      proyecto_id: c.proyecto_id,
      usuario_id: c.usuario_id,
      comentario: c.comentario,
      tipo_comentario: c.tipo_comentario,
      comentario_padre_id: c.comentario_padre_id,
      fecha_comentario: c.fecha_comentario,
      editado: c.editado,
      fecha_edicion: c.fecha_edicion,
      usuario_nombre: c.usuario_nombre,
      usuario_apellido: c.usuario_apellido,
      usuario_rol: c.usuario_rol
    }));
  }

  // Obtener respuestas de un comentario
  static async obtenerRespuestas(comentarioPadreId: number): Promise<any[]> {
    const respuestas = await query.all(
      `SELECT c.*, 
              u.nombre as usuario_nombre, 
              u.apellido as usuario_apellido,
              u.rol as usuario_rol
       FROM comentarios c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.comentario_padre_id = ?
       ORDER BY c.fecha_comentario ASC`,
      [comentarioPadreId]
    ) as any[];

    return respuestas.map(c => ({
      id: c.id,
      proyecto_id: c.proyecto_id,
      usuario_id: c.usuario_id,
      comentario: c.comentario,
      tipo_comentario: c.tipo_comentario,
      comentario_padre_id: c.comentario_padre_id,
      fecha_comentario: c.fecha_comentario,
      editado: c.editado,
      fecha_edicion: c.fecha_edicion,
      usuario_nombre: c.usuario_nombre,
      usuario_apellido: c.usuario_apellido,
      usuario_rol: c.usuario_rol
    }));
  }

  // Actualizar comentario
  static async actualizar(id: number, comentario: string): Promise<boolean> {
    const result = await query.run(
      `UPDATE comentarios 
       SET comentario = ?, editado = 1, fecha_edicion = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [comentario, id]
    );

    return result.changes > 0;
  }

  // Eliminar comentario
  static async eliminar(id: number): Promise<boolean> {
    const result = await query.run(
      `DELETE FROM comentarios WHERE id = ?`,
      [id]
    );

    return result.changes > 0;
  }
}




