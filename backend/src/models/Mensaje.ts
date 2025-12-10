import { query } from '../config/database';

export interface Mensaje {
  id: number;
  usuario_id: number;
  proyecto_id?: number;
  conversacion_id?: number;
  contenido: string;
  rol: 'user' | 'assistant';
  fecha_creacion: string;
}

export class MensajeModel {
  static async crear(datos: Omit<Mensaje, 'id' | 'fecha_creacion'>): Promise<Mensaje> {
    const result = await query.run(
      `INSERT INTO mensajes_chat (usuario_id, proyecto_id, conversacion_id, contenido, rol)
       VALUES (?, ?, ?, ?, ?)`,
      [datos.usuario_id, datos.proyecto_id || null, datos.conversacion_id || null, datos.contenido, datos.rol]
    );

    if (!result.lastID) {
      throw new Error('Error al guardar el mensaje');
    }

    const nuevoMensaje = await this.obtenerPorId(result.lastID);
    if (!nuevoMensaje) {
      throw new Error('Error al recuperar el mensaje creado');
    }

    return nuevoMensaje;
  }

  static async obtenerPorId(id: number): Promise<Mensaje | null> {
    const mensaje = await query.get(
      'SELECT * FROM mensajes_chat WHERE id = ?',
      [id]
    ) as Mensaje;
    return mensaje || null;
  }

  static async obtenerHistorial(usuarioId: number, proyectoId?: number, conversacionId?: number): Promise<Mensaje[]> {
    let sql = 'SELECT * FROM mensajes_chat WHERE usuario_id = ?';
    const params: any[] = [usuarioId];

    if (conversacionId) {
      sql += ' AND conversacion_id = ?';
      params.push(conversacionId);
    } else if (proyectoId) {
      sql += ' AND proyecto_id = ? AND conversacion_id IS NULL';
      params.push(proyectoId);
    } else {
      sql += ' AND proyecto_id IS NULL AND conversacion_id IS NULL';
    }

    sql += ' ORDER BY fecha_creacion ASC';

    return await query.all(sql, params) as Mensaje[];
  }

  // Método para limpiar historial si se necesita (opcional)
  static async eliminarHistorial(usuarioId: number, proyectoId?: number): Promise<void> {
    let sql = 'DELETE FROM mensajes_chat WHERE usuario_id = ?';
    const params: any[] = [usuarioId];

    if (proyectoId) {
      sql += ' AND proyecto_id = ?';
      params.push(proyectoId);
    } else {
      sql += ' AND proyecto_id IS NULL';
    }

    await query.run(sql, params);
  }
}


