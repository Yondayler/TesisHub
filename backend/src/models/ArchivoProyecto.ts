import { query } from '../config/database';
import { ArchivoProyecto } from '../types';

export class ArchivoProyectoModel {
  // Crear archivo
  static async crear(archivo: Omit<ArchivoProyecto, 'id' | 'fecha_subida'>): Promise<number> {
    const result = await query.run(
      `INSERT INTO archivos_proyecto (proyecto_id, nombre_archivo, nombre_original, tipo_archivo, ruta_archivo, tamaño_bytes, descripcion, version, categoria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        archivo.proyecto_id,
        archivo.nombre_archivo,
        archivo.nombre_original,
        archivo.tipo_archivo,
        archivo.ruta_archivo,
        archivo.tamaño_bytes,
        archivo.descripcion || null,
        archivo.version || 1,
        archivo.categoria || null,
      ]
    );

    return result.lastID;
  }

  // Obtener archivo por ID
  static async obtenerPorId(id: number): Promise<ArchivoProyecto | null> {
    const archivo = await query.get(
      `SELECT * FROM archivos_proyecto WHERE id = ?`,
      [id]
    ) as ArchivoProyecto | undefined;

    return archivo || null;
  }

  // Obtener archivos por proyecto
  static async obtenerPorProyecto(proyectoId: number): Promise<ArchivoProyecto[]> {
    const archivos = await query.all(
      `SELECT * FROM archivos_proyecto WHERE proyecto_id = ? ORDER BY fecha_subida DESC`,
      [proyectoId]
    ) as ArchivoProyecto[];

    return archivos;
  }

  // Eliminar archivo
  static async eliminar(id: number): Promise<boolean> {
    const result = await query.run(
      `DELETE FROM archivos_proyecto WHERE id = ?`,
      [id]
    );

    return result.changes > 0;
  }

  // Obtener última versión de un archivo por nombre
  static async obtenerUltimaVersion(proyectoId: number, nombreOriginal: string): Promise<number> {
    const archivo = await query.get(
      `SELECT MAX(version) as maxVersion FROM archivos_proyecto 
       WHERE proyecto_id = ? AND nombre_original = ?`,
      [proyectoId, nombreOriginal]
    ) as { maxVersion: number } | undefined;

    return archivo?.maxVersion || 0;
  }
}



