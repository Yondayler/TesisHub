import { query } from './database';
import fs from 'fs';
import path from 'path';

export const initDatabase = async (): Promise<void> => {
  try {
    // Crear todas las tablas
    await crearTablas();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

const crearTablas = async (): Promise<void> => {
  // Tabla usuarios
  await query.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      cedula TEXT UNIQUE,
      telefono TEXT,
      rol TEXT NOT NULL DEFAULT 'estudiante',
      activo INTEGER NOT NULL DEFAULT 1,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_acceso DATETIME
    )
  `);

  // Tabla proyectos
  await query.run(`
    CREATE TABLE IF NOT EXISTS proyectos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      objetivo_general TEXT,
      objetivos_especificos TEXT,
      justificacion TEXT,
      metodologia TEXT,
      resultados_esperados TEXT,
      presupuesto_estimado REAL,
      duracion_meses INTEGER,
      estudiante_id INTEGER NOT NULL,
      tutor_id INTEGER,
      estado TEXT NOT NULL DEFAULT 'borrador',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_envio DATETIME,
      fecha_revision DATETIME,
      fecha_aprobacion DATETIME,
      observaciones TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
      FOREIGN KEY (tutor_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla revisiones
  await query.run(`
    CREATE TABLE IF NOT EXISTS revisiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      revisor_id INTEGER NOT NULL,
      tipo_revision TEXT NOT NULL,
      comentarios TEXT NOT NULL,
      criterios_evaluacion TEXT,
      puntaje_total REAL,
      recomendacion TEXT NOT NULL,
      fecha_revision DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (revisor_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla archivos_proyecto
  await query.run(`
    CREATE TABLE IF NOT EXISTS archivos_proyecto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      nombre_archivo TEXT NOT NULL,
      nombre_original TEXT NOT NULL,
      tipo_archivo TEXT NOT NULL,
      ruta_archivo TEXT NOT NULL,
      tamaño_bytes INTEGER NOT NULL,
      descripcion TEXT,
      fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
    )
  `);

  // Tabla comentarios
  await query.run(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      tipo_comentario TEXT NOT NULL DEFAULT 'general',
      comentario_padre_id INTEGER,
      fecha_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
      editado INTEGER NOT NULL DEFAULT 0,
      fecha_edicion DATETIME,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (comentario_padre_id) REFERENCES comentarios(id)
    )
  `);

  // Tabla historial_proyectos
  await query.run(`
    CREATE TABLE IF NOT EXISTS historial_proyectos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      estado_anterior TEXT,
      estado_nuevo TEXT,
      descripcion TEXT,
      fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla notificaciones
  await query.run(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      proyecto_id INTEGER,
      tipo_notificacion TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      leida INTEGER NOT NULL DEFAULT 0,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_lectura DATETIME,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
    )
  `);

  // Tabla asignaciones_tutores
  await query.run(`
    CREATE TABLE IF NOT EXISTS asignaciones_tutores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      tutor_id INTEGER NOT NULL,
      fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      activa INTEGER NOT NULL DEFAULT 1,
      observaciones TEXT,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (tutor_id) REFERENCES usuarios(id),
      UNIQUE(proyecto_id, tutor_id)
    )
  `);

  // Crear índices
  await crearIndices();
};

const crearIndices = async (): Promise<void> => {
  // Índices para usuarios
  await query.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol)`);

  // Índices para proyectos
  await query.run(`CREATE INDEX IF NOT EXISTS idx_proyectos_estudiante ON proyectos(estudiante_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_proyectos_tutor ON proyectos(tutor_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_proyectos_fecha_envio ON proyectos(fecha_envio)`);

  // Índices para revisiones
  await query.run(`CREATE INDEX IF NOT EXISTS idx_revisiones_proyecto ON revisiones(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_revisiones_revisor ON revisiones(revisor_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_revisiones_fecha ON revisiones(fecha_revision)`);

  // Índices para archivos
  await query.run(`CREATE INDEX IF NOT EXISTS idx_archivos_proyecto ON archivos_proyecto(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_archivos_tipo ON archivos_proyecto(tipo_archivo)`);

  // Índices para comentarios
  await query.run(`CREATE INDEX IF NOT EXISTS idx_comentarios_proyecto ON comentarios(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_comentarios_usuario ON comentarios(usuario_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_comentarios_padre ON comentarios(comentario_padre_id)`);

  // Índices para historial
  await query.run(`CREATE INDEX IF NOT EXISTS idx_historial_proyecto ON historial_proyectos(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_proyectos(usuario_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_proyectos(fecha_accion)`);

  // Índices para notificaciones
  await query.run(`CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON notificaciones(fecha_creacion)`);

  // Índices para asignaciones
  await query.run(`CREATE INDEX IF NOT EXISTS idx_asignaciones_proyecto ON asignaciones_tutores(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_asignaciones_tutor ON asignaciones_tutores(tutor_id)`);
};


