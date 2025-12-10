import { query } from './database';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UsuarioModel } from '../models/Usuario';
import { TesisCanvasModel } from '../models/TesisCanvas';

export const initDatabase = async (): Promise<void> => {
  try {
    // Crear todas las tablas
    await crearTablas();

    // Inicializar tabla de tesis canvas
    await TesisCanvasModel.inicializar();

    // Crear administrador inicial si no existe
    await crearAdministradorInicial();

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

  // Tabla observaciones_proyecto - Para almacenar múltiples observaciones con fecha/hora
  await query.run(`
    CREATE TABLE IF NOT EXISTS observaciones_proyecto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proyecto_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      observacion TEXT NOT NULL,
      estado_proyecto TEXT NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla auditoria - Para registrar todas las acciones de administradores
  await query.run(`
    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      administrador_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id INTEGER,
      detalles TEXT,
      datos_anteriores TEXT,
      datos_nuevos TEXT,
      fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (administrador_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla tesis_referencias - Base de datos de tesis para el agente de IA
  await query.run(`
    CREATE TABLE IF NOT EXISTS tesis_referencias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      autor TEXT NOT NULL,
      año INTEGER NOT NULL,
      universidad TEXT,
      carrera TEXT,
      area_conocimiento TEXT,
      resumen TEXT NOT NULL,
      metodologia TEXT,
      palabras_clave TEXT,
      contenido_completo TEXT,
      archivo_pdf TEXT,
      estado TEXT DEFAULT 'disponible',
      fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    )
  `);

  // Tabla tesis_embeddings - Para almacenar embeddings vectoriales (RAG)
  await query.run(`
    CREATE TABLE IF NOT EXISTS tesis_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tesis_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding BLOB,
      metadata TEXT,
      FOREIGN KEY (tesis_id) REFERENCES tesis_referencias(id) ON DELETE CASCADE
    )
  `);

  // Tabla mensajes_chat - Historial de conversaciones
  await query.run(`
    CREATE TABLE IF NOT EXISTS mensajes_chat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      proyecto_id INTEGER,
      contenido TEXT NOT NULL,
      rol TEXT NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
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

  // Índices para observaciones
  await query.run(`CREATE INDEX IF NOT EXISTS idx_observaciones_proyecto ON observaciones_proyecto(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_observaciones_usuario ON observaciones_proyecto(usuario_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_observaciones_fecha ON observaciones_proyecto(fecha_creacion)`);

  // Índices para auditoría
  await query.run(`CREATE INDEX IF NOT EXISTS idx_auditoria_administrador ON auditoria(administrador_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, entidad_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria(accion)`);

  // Índices para tesis_referencias
  await query.run(`CREATE INDEX IF NOT EXISTS idx_tesis_carrera ON tesis_referencias(carrera)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_tesis_area ON tesis_referencias(area_conocimiento)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_tesis_año ON tesis_referencias(año)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_tesis_estado ON tesis_referencias(estado)`);

  // Índices para tesis_embeddings
  await query.run(`CREATE INDEX IF NOT EXISTS idx_embeddings_tesis ON tesis_embeddings(tesis_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON tesis_embeddings(tesis_id, chunk_index)`);

  // Índices para mensajes_chat
  await query.run(`CREATE INDEX IF NOT EXISTS idx_mensajes_usuario ON mensajes_chat(usuario_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_mensajes_proyecto ON mensajes_chat(proyecto_id)`);
  await query.run(`CREATE INDEX IF NOT EXISTS idx_mensajes_fecha ON mensajes_chat(fecha_creacion)`);

  // Migración: Agregar nuevos campos a proyectos si no existen
  try {
    const tableInfo = await query.all('PRAGMA table_info(proyectos)') as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('planteamiento')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN planteamiento TEXT');
      console.log('✓ Columna "planteamiento" agregada');
    }

    if (!columnNames.includes('solucion_problema')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN solucion_problema TEXT');
      console.log('✓ Columna "solucion_problema" agregada');
    }

    if (!columnNames.includes('diagnosticos')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN diagnosticos TEXT');
      console.log('✓ Columna "diagnosticos" agregada');
    }

    if (!columnNames.includes('antecedentes')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN antecedentes TEXT');
      console.log('✓ Columna "antecedentes" agregada');
    }
  } catch (error) {
    console.error('Error en migración de campos de proyecto:', error);
  }

  // Migración: Agregar campo categoria a archivos_proyecto si no existe
  try {
    const archivosTableInfo = await query.all('PRAGMA table_info(archivos_proyecto)') as Array<{ name: string }>;
    const archivosColumnNames = archivosTableInfo.map(col => col.name);

    if (!archivosColumnNames.includes('categoria')) {
      await query.run('ALTER TABLE archivos_proyecto ADD COLUMN categoria TEXT');
      console.log('✓ Columna "categoria" agregada a archivos_proyecto');
    }
  } catch (error) {
    console.error('Error en migración de campos de archivos:', error);
  }
};

// Crear administrador inicial si no existe
const crearAdministradorInicial = async (): Promise<void> => {
  try {
    const ADMIN_EMAIL = 'admin@tesishub.com';
    const ADMIN_PASSWORD = 'Admin123!';
    const ADMIN_NOMBRE = 'Administrador';
    const ADMIN_APELLIDO = 'Sistema';

    // Verificar si ya existe un administrador con este email
    const adminExistente = await UsuarioModel.obtenerPorEmail(ADMIN_EMAIL);

    if (adminExistente) {
      if (adminExistente.rol === 'administrador') {
        console.log('✅ Administrador inicial ya existe (email: ' + ADMIN_EMAIL + ')');
        return;
      } else {
        console.log('⚠️  El email ' + ADMIN_EMAIL + ' existe pero no es administrador. Rol actual: ' + adminExistente.rol);
        // No crear si el email ya existe con otro rol
        return;
      }
    }

    // Verificar si existe algún administrador en el sistema
    const todosUsuarios = await UsuarioModel.listar();
    const administradores = todosUsuarios.filter(u => u.rol === 'administrador');

    if (administradores.length > 0) {
      console.log(`✅ Ya existen ${administradores.length} administrador(es) en el sistema`);
      return;
    }

    // No hay administradores, crear el inicial
    console.log('📝 Creando administrador inicial...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await query.run(
      `INSERT INTO usuarios (email, password, nombre, apellido, rol, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ADMIN_EMAIL,
        hashedPassword,
        ADMIN_NOMBRE,
        ADMIN_APELLIDO,
        'administrador',
        1
      ]
    );

    if (result.lastID) {
      console.log('✅ Administrador inicial creado exitosamente');
      console.log(`   ID: ${result.lastID}`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    } else {
      console.log('⚠️  No se pudo obtener el ID del administrador creado');
    }
  } catch (error: any) {
    // Si el error es por email duplicado, significa que ya existe (race condition)
    if (error.message?.includes('UNIQUE constraint') ||
      error.message?.includes('email') ||
      error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('✅ Administrador inicial ya existe (verificado por constraint de base de datos)');
      return;
    }
    console.error('⚠️  Error al crear administrador inicial:', error.message);
    console.error('   Stack:', error.stack);
    // No lanzar error para no bloquear la inicialización
  }
};





