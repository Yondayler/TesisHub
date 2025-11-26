import { query } from '../config/database';
import { Auditoria } from '../types';

export class AuditoriaModel {
  // Crear registro de auditoría
  static async crear(auditoria: Auditoria): Promise<number> {
    const result = await query.run(
      `INSERT INTO auditoria (administrador_id, accion, entidad, entidad_id, detalles, datos_anteriores, datos_nuevos)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        auditoria.administrador_id,
        auditoria.accion,
        auditoria.entidad,
        auditoria.entidad_id || null,
        auditoria.detalles || null,
        auditoria.datos_anteriores || null,
        auditoria.datos_nuevos || null,
      ]
    );

    return result.lastID;
  }

  // Obtener todos los registros de auditoría
  static async listar(limit?: number, offset?: number): Promise<Auditoria[]> {
    let sql = `
      SELECT 
        a.*,
        u.nombre as administrador_nombre,
        u.apellido as administrador_apellido,
        u.email as administrador_email
      FROM auditoria a
      LEFT JOIN usuarios u ON a.administrador_id = u.id
      ORDER BY a.fecha_accion DESC
    `;

    const params: any[] = [];

    if (limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    const registros = await query.all(sql, params) as Auditoria[];
    return registros;
  }

  // Obtener registros de auditoría por administrador
  static async obtenerPorAdministrador(administradorId: number, limit?: number, offset?: number): Promise<Auditoria[]> {
    let sql = `
      SELECT 
        a.*,
        u.nombre as administrador_nombre,
        u.apellido as administrador_apellido,
        u.email as administrador_email
      FROM auditoria a
      LEFT JOIN usuarios u ON a.administrador_id = u.id
      WHERE a.administrador_id = ?
      ORDER BY a.fecha_accion DESC
    `;

    const params: any[] = [administradorId];

    if (limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    const registros = await query.all(sql, params) as Auditoria[];
    return registros;
  }

  // Obtener registros de auditoría por entidad
  static async obtenerPorEntidad(entidad: string, entidadId?: number, limit?: number, offset?: number): Promise<Auditoria[]> {
    let sql = `
      SELECT 
        a.*,
        u.nombre as administrador_nombre,
        u.apellido as administrador_apellido,
        u.email as administrador_email
      FROM auditoria a
      LEFT JOIN usuarios u ON a.administrador_id = u.id
      WHERE a.entidad = ?
    `;

    const params: any[] = [entidad];

    if (entidadId !== undefined) {
      sql += ' AND a.entidad_id = ?';
      params.push(entidadId);
    }

    sql += ' ORDER BY a.fecha_accion DESC';

    if (limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    const registros = await query.all(sql, params) as Auditoria[];
    return registros;
  }

  // Contar total de registros
  static async contar(): Promise<number> {
    const result = await query.get(
      `SELECT COUNT(*) as total FROM auditoria`
    ) as { total: number } | undefined;
    
    return result?.total || 0;
  }
}

