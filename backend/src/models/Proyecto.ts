import { dbAll, dbGet, dbRun } from '../config/database';
import { Proyecto } from '../types';

export class ProyectoModel {
  // Crear un nuevo proyecto
  static async crear(proyecto: Proyecto): Promise<number> {
    const sql = `
      INSERT INTO proyectos (
        titulo, descripcion, planteamiento, solucion_problema, diagnosticos, antecedentes,
        objetivo_general, objetivos_especificos, justificacion, metodologia, resultados_esperados, 
        presupuesto_estimado, duracion_meses, estudiante_id, tutor_id, estado, version, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await dbRun(sql, [
      proyecto.titulo,
      proyecto.descripcion,
      proyecto.planteamiento || null,
      proyecto.solucion_problema || null,
      proyecto.diagnosticos || null,
      proyecto.antecedentes || null,
      proyecto.objetivo_general || null,
      proyecto.objetivos_especificos || null,
      proyecto.justificacion || null,
      proyecto.metodologia || null,
      proyecto.resultados_esperados || null,
      proyecto.presupuesto_estimado || null,
      proyecto.duracion_meses || null,
      proyecto.estudiante_id,
      proyecto.tutor_id || null,
      proyecto.estado || 'borrador',
      proyecto.version || 1,
      proyecto.observaciones || null
    ]);
    
    return result.lastID;
  }

  // Obtener proyecto por ID
  static async obtenerPorId(id: number): Promise<Proyecto | null> {
    const sql = `
      SELECT p.*, 
             e.nombre as estudiante_nombre, 
             e.apellido as estudiante_apellido,
             t.nombre as tutor_nombre, 
             t.apellido as tutor_apellido
      FROM proyectos p
      LEFT JOIN usuarios e ON p.estudiante_id = e.id
      LEFT JOIN usuarios t ON p.tutor_id = t.id
      WHERE p.id = ?
    `;
    
    const proyecto = await dbGet(sql, [id]);
    return proyecto || null;
  }

  // Obtener todos los proyectos de un estudiante
  static async obtenerPorEstudiante(estudianteId: number): Promise<Proyecto[]> {
    const sql = `
      SELECT p.*, 
             t.nombre as tutor_nombre, 
             t.apellido as tutor_apellido
      FROM proyectos p
      LEFT JOIN usuarios t ON p.tutor_id = t.id
      WHERE p.estudiante_id = ?
      ORDER BY p.fecha_creacion DESC
    `;
    
    return await dbAll(sql, [estudianteId]);
  }

  // Obtener todos los proyectos (para administradores)
  static async obtenerTodos(): Promise<Proyecto[]> {
    const sql = `
      SELECT p.*, 
             e.nombre as estudiante_nombre, 
             e.apellido as estudiante_apellido,
             t.nombre as tutor_nombre, 
             t.apellido as tutor_apellido
      FROM proyectos p
      LEFT JOIN usuarios e ON p.estudiante_id = e.id
      LEFT JOIN usuarios t ON p.tutor_id = t.id
      ORDER BY p.fecha_creacion DESC
    `;
    
    return await dbAll(sql, []);
  }

  // Obtener proyectos por tutor
  static async obtenerPorTutor(tutorId: number): Promise<Proyecto[]> {
    const sql = `
      SELECT p.*, 
             e.nombre as estudiante_nombre, 
             e.apellido as estudiante_apellido
      FROM proyectos p
      LEFT JOIN usuarios e ON p.estudiante_id = e.id
      WHERE p.tutor_id = ?
      ORDER BY p.fecha_creacion DESC
    `;
    
    return await dbAll(sql, [tutorId]);
  }

  // Actualizar proyecto
  static async actualizar(id: number, proyecto: Partial<Proyecto>): Promise<number> {
    const campos: string[] = [];
    const valores: any[] = [];

    if (proyecto.titulo !== undefined) {
      campos.push('titulo = ?');
      valores.push(proyecto.titulo);
    }
    if (proyecto.descripcion !== undefined) {
      campos.push('descripcion = ?');
      valores.push(proyecto.descripcion);
    }
    if (proyecto.planteamiento !== undefined) {
      campos.push('planteamiento = ?');
      valores.push(proyecto.planteamiento);
    }
    if (proyecto.solucion_problema !== undefined) {
      campos.push('solucion_problema = ?');
      valores.push(proyecto.solucion_problema);
    }
    if (proyecto.diagnosticos !== undefined) {
      campos.push('diagnosticos = ?');
      valores.push(proyecto.diagnosticos);
    }
    if (proyecto.antecedentes !== undefined) {
      campos.push('antecedentes = ?');
      valores.push(proyecto.antecedentes);
    }
    if (proyecto.objetivo_general !== undefined) {
      campos.push('objetivo_general = ?');
      valores.push(proyecto.objetivo_general);
    }
    if (proyecto.objetivos_especificos !== undefined) {
      campos.push('objetivos_especificos = ?');
      valores.push(proyecto.objetivos_especificos);
    }
    if (proyecto.justificacion !== undefined) {
      campos.push('justificacion = ?');
      valores.push(proyecto.justificacion);
    }
    if (proyecto.metodologia !== undefined) {
      campos.push('metodologia = ?');
      valores.push(proyecto.metodologia);
    }
    if (proyecto.resultados_esperados !== undefined) {
      campos.push('resultados_esperados = ?');
      valores.push(proyecto.resultados_esperados);
    }
    if (proyecto.presupuesto_estimado !== undefined) {
      campos.push('presupuesto_estimado = ?');
      valores.push(proyecto.presupuesto_estimado);
    }
    if (proyecto.duracion_meses !== undefined) {
      campos.push('duracion_meses = ?');
      valores.push(proyecto.duracion_meses);
    }
    if (proyecto.tutor_id !== undefined) {
      campos.push('tutor_id = ?');
      valores.push(proyecto.tutor_id);
    }
    if (proyecto.estado !== undefined) {
      campos.push('estado = ?');
      valores.push(proyecto.estado);
    }
    if (proyecto.observaciones !== undefined) {
      campos.push('observaciones = ?');
      valores.push(proyecto.observaciones);
    }
    if (proyecto.version !== undefined) {
      campos.push('version = ?');
      valores.push(proyecto.version);
    }

    if (campos.length === 0) {
      return 0;
    }

    valores.push(id);
    const sql = `UPDATE proyectos SET ${campos.join(', ')} WHERE id = ?`;
    
    const result = await dbRun(sql, valores);
    return result.changes;
  }

  // Actualizar estado del proyecto
  static async actualizarEstado(id: number, estado: string, observaciones?: string): Promise<number> {
    let sql = 'UPDATE proyectos SET estado = ?';
    const valores: any[] = [estado];

    if (estado === 'enviado') {
      sql += ', fecha_envio = CURRENT_TIMESTAMP';
    } else if (estado === 'en_revision') {
      sql += ', fecha_revision = CURRENT_TIMESTAMP';
    } else if (estado === 'aprobado') {
      sql += ', fecha_aprobacion = CURRENT_TIMESTAMP';
    }

    if (observaciones !== undefined) {
      sql += ', observaciones = ?';
      valores.push(observaciones);
    }

    sql += ' WHERE id = ?';
    valores.push(id);

    const result = await dbRun(sql, valores);
    return result.changes;
  }

  // Eliminar proyecto
  static async eliminar(id: number): Promise<number> {
    const sql = 'DELETE FROM proyectos WHERE id = ?';
    const result = await dbRun(sql, [id]);
    return result.changes;
  }

  // Contar proyectos por estudiante y estado
  static async contarPorEstudiante(estudianteId: number): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borradores,
        SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN estado = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
        SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados,
        SUM(CASE WHEN estado = 'corregir' THEN 1 ELSE 0 END) as corregir
      FROM proyectos
      WHERE estudiante_id = ?
    `;
    
    return await dbGet(sql, [estudianteId]);
  }

  // Contar proyectos por tutor y estado
  static async contarPorTutor(tutorId: number): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borradores,
        SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN estado = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
        SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados,
        SUM(CASE WHEN estado = 'corregir' THEN 1 ELSE 0 END) as corregir
      FROM proyectos
      WHERE tutor_id = ?
    `;
    
    return await dbGet(sql, [tutorId]);
  }

  // Contar todos los proyectos (para administradores)
  static async contarTodos(): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'borrador' THEN 1 ELSE 0 END) as borradores,
        SUM(CASE WHEN estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN estado = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
        SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados,
        SUM(CASE WHEN estado = 'corregir' THEN 1 ELSE 0 END) as corregir
      FROM proyectos
    `;
    
    return await dbGet(sql, []);
  }

  // Contar proyectos activos (enviados + en_revision)
  static async contarActivos(): Promise<number> {
    const sql = `
      SELECT COUNT(*) as total
      FROM proyectos
      WHERE estado IN ('enviado', 'en_revision')
    `;
    
    const result = await dbGet(sql, []);
    return result?.total || 0;
  }

  // Calcular tasa de aprobación
  static async calcularTasaAprobacion(): Promise<number> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados
      FROM proyectos
      WHERE estado != 'borrador'
    `;
    
    const result = await dbGet(sql, []);
    if (!result || result.total === 0) return 0;
    return ((result.aprobados || 0) / result.total) * 100;
  }

  // Obtener proyectos agrupados por fecha (últimos N días)
  static async obtenerProyectosPorFecha(dias: number = 90): Promise<any[]> {
    // Construir la fecha límite dinámicamente
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
    
    const sql = `
      SELECT 
        DATE(fecha_creacion) as date,
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN estado IN ('enviado', 'en_revision', 'corregir') THEN 1 ELSE 0 END) as en_proceso
      FROM proyectos
      WHERE DATE(fecha_creacion) >= DATE(?)
      GROUP BY DATE(fecha_creacion)
      ORDER BY date ASC
    `;
    
    return await dbAll(sql, [fechaLimiteStr]);
  }
}





