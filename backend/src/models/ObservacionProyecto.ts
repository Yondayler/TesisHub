import { dbAll, dbGet, dbRun } from '../config/database';
import { ObservacionProyecto } from '../types';

export class ObservacionProyectoModel {
  // Crear una nueva observación
  static async crear(observacion: ObservacionProyecto): Promise<number> {
    const sql = `
      INSERT INTO observaciones_proyecto (
        proyecto_id, usuario_id, observacion, estado_proyecto
      ) VALUES (?, ?, ?, ?)
    `;
    
    const result = await dbRun(sql, [
      observacion.proyecto_id,
      observacion.usuario_id,
      observacion.observacion,
      observacion.estado_proyecto
    ]);
    
    return result.lastID;
  }

  // Obtener todas las observaciones de un proyecto
  static async obtenerPorProyecto(proyectoId: number): Promise<ObservacionProyecto[]> {
    const sql = `
      SELECT o.*, 
             u.nombre as usuario_nombre, 
             u.apellido as usuario_apellido
      FROM observaciones_proyecto o
      LEFT JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.proyecto_id = ?
      ORDER BY o.fecha_creacion DESC
    `;
    
    return await dbAll(sql, [proyectoId]);
  }

  // Obtener una observación por ID
  static async obtenerPorId(id: number): Promise<ObservacionProyecto | null> {
    const sql = `
      SELECT o.*, 
             u.nombre as usuario_nombre, 
             u.apellido as usuario_apellido
      FROM observaciones_proyecto o
      LEFT JOIN usuarios u ON o.usuario_id = u.id
      WHERE o.id = ?
    `;
    
    const observacion = await dbGet(sql, [id]);
    return observacion || null;
  }
}


