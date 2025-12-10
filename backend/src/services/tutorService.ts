import { dbAll } from '../config/database';
import { UsuarioSinPassword } from '../types';

export class TutorService {
  // Obtener estudiantes tutorizados (estudiantes únicos que tienen proyectos asignados al tutor)
  static async obtenerEstudiantesTutorizados(tutorId: number): Promise<any[]> {
    const sql = `
      SELECT DISTINCT
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.cedula,
        u.telefono,
        COUNT(DISTINCT p.id) as total_proyectos,
        SUM(CASE WHEN p.estado = 'borrador' THEN 1 ELSE 0 END) as proyectos_borrador,
        SUM(CASE WHEN p.estado = 'enviado' THEN 1 ELSE 0 END) as proyectos_enviados,
        SUM(CASE WHEN p.estado = 'en_revision' THEN 1 ELSE 0 END) as proyectos_en_revision,
        SUM(CASE WHEN p.estado = 'aprobado' THEN 1 ELSE 0 END) as proyectos_aprobados,
        SUM(CASE WHEN p.estado = 'rechazado' THEN 1 ELSE 0 END) as proyectos_rechazados,
        SUM(CASE WHEN p.estado = 'corregir' THEN 1 ELSE 0 END) as proyectos_corregir
      FROM usuarios u
      INNER JOIN proyectos p ON u.id = p.estudiante_id
      WHERE p.tutor_id = ?
      GROUP BY u.id, u.nombre, u.apellido, u.email, u.cedula, u.telefono
      ORDER BY u.apellido, u.nombre
    `;
    
    return await dbAll(sql, [tutorId]);
  }

  // Obtener proyectos de un estudiante específico (para tutores)
  static async obtenerProyectosPorEstudiante(
    estudianteId: number,
    tutorId: number
  ): Promise<any[]> {
    const sql = `
      SELECT p.*, 
             e.nombre as estudiante_nombre, 
             e.apellido as estudiante_apellido
      FROM proyectos p
      LEFT JOIN usuarios e ON p.estudiante_id = e.id
      WHERE p.estudiante_id = ? AND p.tutor_id = ?
      ORDER BY p.fecha_creacion DESC
    `;
    
    return await dbAll(sql, [estudianteId, tutorId]);
  }
}




