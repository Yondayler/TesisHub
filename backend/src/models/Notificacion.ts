import { dbAll, dbRun } from '../config/database';
import { Notificacion } from '../types';

export class NotificacionModel {
  // Crear una nueva notificación
  static async crear(notificacion: Notificacion): Promise<number> {
    const sql = `
      INSERT INTO notificaciones (
        usuario_id, proyecto_id, tipo_notificacion, titulo, mensaje, leida
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await dbRun(sql, [
      notificacion.usuario_id,
      notificacion.proyecto_id || null,
      notificacion.tipo_notificacion,
      notificacion.titulo,
      notificacion.mensaje,
      notificacion.leida || 0,
    ]);

    return result.lastID;
  }

  // Obtener notificaciones de un usuario
  static async obtenerPorUsuario(usuarioId: number, soloNoLeidas: boolean = false): Promise<Notificacion[]> {
    let sql = `
      SELECT n.*, p.titulo as proyecto_titulo
      FROM notificaciones n
      LEFT JOIN proyectos p ON n.proyecto_id = p.id
      WHERE n.usuario_id = ?
    `;

    const params: any[] = [usuarioId];

    if (soloNoLeidas) {
      sql += ' AND n.leida = 0';
    }

    sql += ' ORDER BY n.fecha_creacion DESC';

    return await dbAll(sql, params);
  }

  // Marcar notificación como leída
  static async marcarComoLeida(id: number, usuarioId: number): Promise<number> {
    const sql = `
      UPDATE notificaciones
      SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP
      WHERE id = ? AND usuario_id = ?
    `;

    const result = await dbRun(sql, [id, usuarioId]);
    return result.changes;
  }

  // Marcar todas las notificaciones de un usuario como leídas
  static async marcarTodasComoLeidas(usuarioId: number): Promise<number> {
    const sql = `
      UPDATE notificaciones
      SET leida = 1, fecha_lectura = CURRENT_TIMESTAMP
      WHERE usuario_id = ? AND leida = 0
    `;

    const result = await dbRun(sql, [usuarioId]);
    return result.changes;
  }

  // Contar notificaciones no leídas de un usuario
  static async contarNoLeidas(usuarioId: number): Promise<number> {
    const sql = `
      SELECT COUNT(*) as total
      FROM notificaciones
      WHERE usuario_id = ? AND leida = 0
    `;

    const result = await dbAll(sql, [usuarioId]);
    return result[0]?.total || 0;
  }

  // Eliminar notificación (solo del propietario)
  static async eliminar(id: number, usuarioId: number): Promise<number> {
    const sql = 'DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?';

    const result = await dbRun(sql, [id, usuarioId]);
    return result.changes;
  }
}






