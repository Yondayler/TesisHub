import { dbAll, dbGet, dbRun } from '../config/database';
import { TesisReferencia } from '../types';

export class TesisReferenciaModel {
  // Crear una nueva tesis
  static async crear(tesis: TesisReferencia): Promise<number> {
    const sql = `
      INSERT INTO tesis_referencias (
        titulo, autor, año, universidad, carrera, area_conocimiento,
        resumen, metodologia, palabras_clave, contenido_completo,
        archivo_pdf, estado, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbRun(sql, [
      tesis.titulo,
      tesis.autor,
      tesis.año,
      tesis.universidad || null,
      tesis.carrera || null,
      tesis.area_conocimiento || null,
      tesis.resumen,
      tesis.metodologia || null,
      tesis.palabras_clave || null,
      tesis.contenido_completo || null,
      tesis.archivo_pdf || null,
      tesis.estado || 'disponible',
      tesis.metadata || null
    ]);
    
    return result.lastID;
  }

  // Obtener tesis por ID
  static async obtenerPorId(id: number): Promise<TesisReferencia | null> {
    const sql = `
      SELECT * FROM tesis_referencias WHERE id = ?
    `;
    
    const tesis = await dbGet(sql, [id]);
    return tesis || null;
  }

  // Obtener todas las tesis
  static async obtenerTodas(limit?: number, offset?: number): Promise<TesisReferencia[]> {
    let sql = 'SELECT * FROM tesis_referencias WHERE estado = ? ORDER BY fecha_ingreso DESC';
    const params: any[] = ['disponible'];
    
    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);
      if (offset) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    return await dbAll(sql, params);
  }

  // Obtener tesis por nombre de archivo exacto
  static async obtenerPorNombreArchivo(nombreArchivo: string): Promise<TesisReferencia | null> {
    const sql = `
      SELECT * FROM tesis_referencias 
      WHERE archivo_pdf = ? AND estado = 'disponible'
    `;
    
    const tesis = await dbGet(sql, [nombreArchivo]);
    return tesis || null;
  }

  // Buscar tesis por texto (búsqueda simple)
  static async buscar(query: string, carrera?: string, limit: number = 5): Promise<TesisReferencia[]> {
    let sql = `
      SELECT * FROM tesis_referencias
      WHERE estado = 'disponible'
        AND (
          titulo LIKE ? OR
          resumen LIKE ? OR
          palabras_clave LIKE ? OR
          contenido_completo LIKE ?
        )
    `;
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`];
    
    if (carrera) {
      sql += ' AND carrera = ?';
      params.push(carrera);
    }
    
    sql += ' ORDER BY fecha_ingreso DESC LIMIT ?';
    params.push(limit);
    
    return await dbAll(sql, params);
  }

  // Buscar tesis por carrera
  static async buscarPorCarrera(carrera: string, limit: number = 10): Promise<TesisReferencia[]> {
    const sql = `
      SELECT * FROM tesis_referencias
      WHERE carrera = ? AND estado = 'disponible'
      ORDER BY año DESC, fecha_ingreso DESC
      LIMIT ?
    `;
    
    return await dbAll(sql, [carrera, limit]);
  }

  // Buscar tesis por área de conocimiento
  static async buscarPorArea(area: string, limit: number = 10): Promise<TesisReferencia[]> {
    const sql = `
      SELECT * FROM tesis_referencias
      WHERE area_conocimiento = ? AND estado = 'disponible'
      ORDER BY año DESC, fecha_ingreso DESC
      LIMIT ?
    `;
    
    return await dbAll(sql, [area, limit]);
  }

  // Obtener tesis por IDs (útil para RAG cuando se recuperan IDs)
  static async obtenerPorIds(ids: number[]): Promise<TesisReferencia[]> {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const sql = `
      SELECT * FROM tesis_referencias
      WHERE id IN (${placeholders})
      ORDER BY fecha_ingreso DESC
    `;
    
    return await dbAll(sql, ids);
  }

  // Actualizar tesis
  static async actualizar(id: number, tesis: Partial<TesisReferencia>): Promise<boolean> {
    const campos: string[] = [];
    const valores: any[] = [];
    
    if (tesis.titulo !== undefined) { campos.push('titulo = ?'); valores.push(tesis.titulo); }
    if (tesis.autor !== undefined) { campos.push('autor = ?'); valores.push(tesis.autor); }
    if (tesis.año !== undefined) { campos.push('año = ?'); valores.push(tesis.año); }
    if (tesis.universidad !== undefined) { campos.push('universidad = ?'); valores.push(tesis.universidad); }
    if (tesis.carrera !== undefined) { campos.push('carrera = ?'); valores.push(tesis.carrera); }
    if (tesis.area_conocimiento !== undefined) { campos.push('area_conocimiento = ?'); valores.push(tesis.area_conocimiento); }
    if (tesis.resumen !== undefined) { campos.push('resumen = ?'); valores.push(tesis.resumen); }
    if (tesis.metodologia !== undefined) { campos.push('metodologia = ?'); valores.push(tesis.metodologia); }
    if (tesis.palabras_clave !== undefined) { campos.push('palabras_clave = ?'); valores.push(tesis.palabras_clave); }
    if (tesis.contenido_completo !== undefined) { campos.push('contenido_completo = ?'); valores.push(tesis.contenido_completo); }
    if (tesis.archivo_pdf !== undefined) { campos.push('archivo_pdf = ?'); valores.push(tesis.archivo_pdf); }
    if (tesis.estado !== undefined) { campos.push('estado = ?'); valores.push(tesis.estado); }
    if (tesis.metadata !== undefined) { campos.push('metadata = ?'); valores.push(tesis.metadata); }
    
    if (campos.length === 0) return false;
    
    valores.push(id);
    const sql = `UPDATE tesis_referencias SET ${campos.join(', ')} WHERE id = ?`;
    
    const result = await dbRun(sql, valores);
    return result.changes > 0;
  }

  // Eliminar tesis (soft delete cambiando estado)
  static async eliminar(id: number): Promise<boolean> {
    const sql = `UPDATE tesis_referencias SET estado = 'restringido' WHERE id = ?`;
    const result = await dbRun(sql, [id]);
    return result.changes > 0;
  }

  // Obtener estadísticas
  static async obtenerEstadisticas(): Promise<{
    total: number;
    por_carrera: Array<{ carrera: string; count: number }>;
    por_area: Array<{ area: string; count: number }>;
  }> {
    const total = await dbGet('SELECT COUNT(*) as count FROM tesis_referencias WHERE estado = ?', ['disponible']) as { count: number };
    
    const porCarrera = await dbAll(`
      SELECT carrera, COUNT(*) as count
      FROM tesis_referencias
      WHERE estado = 'disponible' AND carrera IS NOT NULL
      GROUP BY carrera
      ORDER BY count DESC
      LIMIT 10
    `, []) as Array<{ carrera: string; count: number }>;
    
    const porArea = await dbAll(`
      SELECT area_conocimiento as area, COUNT(*) as count
      FROM tesis_referencias
      WHERE estado = 'disponible' AND area_conocimiento IS NOT NULL
      GROUP BY area_conocimiento
      ORDER BY count DESC
      LIMIT 10
    `, []) as Array<{ area: string; count: number }>;
    
    return {
      total: total?.count || 0,
      por_carrera: porCarrera,
      por_area: porArea
    };
  }
}
