# Esquema de Base de Datos - Sistema de Aceptación de Proyectos

## Descripción General

Este documento describe el esquema completo de la base de datos SQLite para el sistema de aceptación de proyectos. Incluye 8 tablas principales para gestionar usuarios, proyectos, revisiones, archivos, comentarios, historial, notificaciones y asignaciones de tutores.

---

## Tablas Principales

### 1. usuarios

Almacena la información de los usuarios del sistema (estudiantes, profesores, administradores).

```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula TEXT UNIQUE,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'estudiante', -- estudiante, profesor, administrador
  activo INTEGER NOT NULL DEFAULT 1, -- 1 = activo, 0 = inactivo
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso DATETIME
);
```

**Índices:**
```sql
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
```

---

### 2. proyectos

Tabla principal que almacena los proyectos enviados para revisión.

```sql
CREATE TABLE proyectos (
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
  tutor_id INTEGER, -- Profesor asignado como tutor
  estado TEXT NOT NULL DEFAULT 'borrador', -- borrador, enviado, en_revision, aprobado, rechazado, corregir
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_envio DATETIME, -- Fecha en que se envió para revisión
  fecha_revision DATETIME, -- Fecha de última revisión
  fecha_aprobacion DATETIME,
  observaciones TEXT, -- Observaciones generales del revisor
  version INTEGER NOT NULL DEFAULT 1, -- Para control de versiones
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
  FOREIGN KEY (tutor_id) REFERENCES usuarios(id)
);
```

**Índices:**
```sql
CREATE INDEX idx_proyectos_estudiante ON proyectos(estudiante_id);
CREATE INDEX idx_proyectos_tutor ON proyectos(tutor_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_fecha_envio ON proyectos(fecha_envio);
```

---

### 3. revisiones

Almacena las revisiones realizadas por los profesores/administradores sobre cada proyecto.

```sql
CREATE TABLE revisiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  revisor_id INTEGER NOT NULL, -- Usuario que realiza la revisión
  tipo_revision TEXT NOT NULL, -- inicial, intermedia, final
  comentarios TEXT NOT NULL,
  criterios_evaluacion TEXT, -- JSON con criterios y puntajes
  puntaje_total REAL, -- Puntaje total de la revisión
  recomendacion TEXT NOT NULL, -- aprobar, rechazar, corregir
  fecha_revision DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (revisor_id) REFERENCES usuarios(id)
);
```

**Índices:**
```sql
CREATE INDEX idx_revisiones_proyecto ON revisiones(proyecto_id);
CREATE INDEX idx_revisiones_revisor ON revisiones(revisor_id);
CREATE INDEX idx_revisiones_fecha ON revisiones(fecha_revision);
```

---

### 4. archivos_proyecto

Almacena los archivos/documentos asociados a cada proyecto.

```sql
CREATE TABLE archivos_proyecto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  nombre_archivo TEXT NOT NULL,
  nombre_original TEXT NOT NULL,
  tipo_archivo TEXT NOT NULL, -- documento, imagen, presentacion, otro
  ruta_archivo TEXT NOT NULL, -- Ruta donde se almacena físicamente
  tamaño_bytes INTEGER NOT NULL,
  descripcion TEXT,
  fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);
```

**Índices:**
```sql
CREATE INDEX idx_archivos_proyecto ON archivos_proyecto(proyecto_id);
CREATE INDEX idx_archivos_tipo ON archivos_proyecto(tipo_archivo);
```

---

### 5. comentarios

Permite que usuarios comenten sobre proyectos (estudiantes, tutores, revisores).

```sql
CREATE TABLE comentarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  comentario TEXT NOT NULL,
  tipo_comentario TEXT NOT NULL DEFAULT 'general', -- general, correccion, pregunta, respuesta
  comentario_padre_id INTEGER, -- Para respuestas anidadas
  fecha_comentario DATETIME DEFAULT CURRENT_TIMESTAMP,
  editado INTEGER NOT NULL DEFAULT 0, -- 1 = editado, 0 = no editado
  fecha_edicion DATETIME,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (comentario_padre_id) REFERENCES comentarios(id)
);
```

**Índices:**
```sql
CREATE INDEX idx_comentarios_proyecto ON comentarios(proyecto_id);
CREATE INDEX idx_comentarios_usuario ON comentarios(usuario_id);
CREATE INDEX idx_comentarios_padre ON comentarios(comentario_padre_id);
```

---

### 6. historial_proyectos

Registra todos los cambios de estado y acciones importantes sobre los proyectos (auditoría).

```sql
CREATE TABLE historial_proyectos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL, -- Usuario que realizó la acción
  accion TEXT NOT NULL, -- crear, enviar, aprobar, rechazar, corregir, actualizar
  estado_anterior TEXT,
  estado_nuevo TEXT,
  descripcion TEXT, -- Descripción de la acción
  fecha_accion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

**Índices:**
```sql
CREATE INDEX idx_historial_proyecto ON historial_proyectos(proyecto_id);
CREATE INDEX idx_historial_usuario ON historial_proyectos(usuario_id);
CREATE INDEX idx_historial_fecha ON historial_proyectos(fecha_accion);
```

---

### 7. notificaciones

Sistema de notificaciones para informar a usuarios sobre cambios en sus proyectos.

```sql
CREATE TABLE notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  proyecto_id INTEGER,
  tipo_notificacion TEXT NOT NULL, -- revision, aprobacion, rechazo, comentario, asignacion
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida INTEGER NOT NULL DEFAULT 0, -- 1 = leída, 0 = no leída
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura DATETIME,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);
```

**Índices:**
```sql
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX idx_notificaciones_fecha ON notificaciones(fecha_creacion);
```

---

### 8. asignaciones_tutores

Gestiona la asignación de tutores a proyectos.

```sql
CREATE TABLE asignaciones_tutores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proyecto_id INTEGER NOT NULL,
  tutor_id INTEGER NOT NULL,
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  activa INTEGER NOT NULL DEFAULT 1, -- 1 = activa, 0 = inactiva
  observaciones TEXT,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
  FOREIGN KEY (tutor_id) REFERENCES usuarios(id),
  UNIQUE(proyecto_id, tutor_id)
);
```

**Índices:**
```sql
CREATE INDEX idx_asignaciones_proyecto ON asignaciones_tutores(proyecto_id);
CREATE INDEX idx_asignaciones_tutor ON asignaciones_tutores(tutor_id);
```

---

## Relaciones entre Tablas

```
usuarios (1) ──< (N) proyectos [estudiante_id]
usuarios (1) ──< (N) proyectos [tutor_id]
usuarios (1) ──< (N) revisiones
usuarios (1) ──< (N) comentarios
usuarios (1) ──< (N) notificaciones
usuarios (1) ──< (N) historial_proyectos
usuarios (1) ──< (N) asignaciones_tutores

proyectos (1) ──< (N) revisiones
proyectos (1) ──< (N) archivos_proyecto
proyectos (1) ──< (N) comentarios
proyectos (1) ──< (N) historial_proyectos
proyectos (1) ──< (N) notificaciones
proyectos (1) ──< (N) asignaciones_tutores

comentarios (1) ──< (N) comentarios [comentario_padre_id]
```

---

## Estados de Proyecto

Los posibles valores para el campo `estado` en la tabla `proyectos`:

- **borrador**: El proyecto está en edición, no ha sido enviado
- **enviado**: El proyecto fue enviado para revisión
- **en_revision**: Un revisor está evaluando el proyecto
- **aprobado**: El proyecto fue aprobado
- **rechazado**: El proyecto fue rechazado
- **corregir**: El proyecto necesita correcciones antes de ser aprobado

---

## Roles de Usuario

Los posibles valores para el campo `rol` en la tabla `usuarios`:

- **estudiante**: Puede crear y gestionar sus propios proyectos
- **profesor**: Puede ser asignado como tutor y revisar proyectos
- **administrador**: Acceso completo al sistema, puede gestionar usuarios y proyectos

---

## Notas de Implementación

1. **SQLite y Fechas**: SQLite almacena fechas como TEXT, INTEGER o REAL. Se recomienda usar TEXT con formato ISO8601 (YYYY-MM-DD HH:MM:SS) o INTEGER (Unix timestamp).

2. **Cascadas**: Se configuraron ON DELETE CASCADE en relaciones donde tiene sentido eliminar registros relacionados cuando se elimina el padre.

3. **Índices**: Se incluyen índices en campos frecuentemente consultados para mejorar el rendimiento.

4. **Versiones**: Los proyectos y archivos incluyen un campo `version` para control de versiones.

5. **Soft Delete**: Considera agregar un campo `eliminado` (INTEGER) en lugar de borrar físicamente registros importantes para mantener auditoría.

---

## Scripts de Inicialización

### Crear todas las tablas

```sql
-- Ejecutar en orden:
-- 1. usuarios
-- 2. proyectos
-- 3. revisiones
-- 4. archivos_proyecto
-- 5. comentarios
-- 6. historial_proyectos
-- 7. notificaciones
-- 8. asignaciones_tutores
-- Luego crear todos los índices
```

### Datos iniciales

```sql
-- Insertar usuario administrador inicial (password debe ser hasheado)
-- INSERT INTO usuarios (email, password, nombre, apellido, rol) 
-- VALUES ('admin@example.com', 'hashed_password', 'Admin', 'Sistema', 'administrador');
```

---

## Consultas Útiles

### Obtener proyectos de un estudiante con su estado
```sql
SELECT p.*, u.nombre || ' ' || u.apellido as estudiante_nombre
FROM proyectos p
JOIN usuarios u ON p.estudiante_id = u.id
WHERE p.estudiante_id = ?;
```

### Obtener proyectos pendientes de revisión
```sql
SELECT p.*, u.nombre || ' ' || u.apellido as estudiante_nombre
FROM proyectos p
JOIN usuarios u ON p.estudiante_id = u.id
WHERE p.estado IN ('enviado', 'en_revision', 'corregir')
ORDER BY p.fecha_envio DESC;
```

### Obtener historial completo de un proyecto
```sql
SELECT h.*, u.nombre || ' ' || u.apellido as usuario_nombre
FROM historial_proyectos h
JOIN usuarios u ON h.usuario_id = u.id
WHERE h.proyecto_id = ?
ORDER BY h.fecha_accion DESC;
```

### Obtener notificaciones no leídas de un usuario
```sql
SELECT * FROM notificaciones
WHERE usuario_id = ? AND leida = 0
ORDER BY fecha_creacion DESC;
```

