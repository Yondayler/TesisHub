// Tipos para Usuarios
export interface Usuario {
  id?: number;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  rol: 'estudiante' | 'profesor' | 'administrador';
  activo: number;
  fecha_registro?: string;
  ultimo_acceso?: string;
}

export interface UsuarioSinPassword {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  rol: 'estudiante' | 'profesor' | 'administrador';
  activo: number;
  fecha_registro?: string;
  ultimo_acceso?: string;
}

// Tipos para Proyectos
export interface Proyecto {
  id?: number;
  titulo: string;
  descripcion: string;
  objetivo_general?: string;
  objetivos_especificos?: string;
  justificacion?: string;
  metodologia?: string;
  resultados_esperados?: string;
  presupuesto_estimado?: number;
  duracion_meses?: number;
  estudiante_id: number;
  tutor_id?: number;
  estado: 'borrador' | 'enviado' | 'en_revision' | 'aprobado' | 'rechazado' | 'corregir';
  fecha_creacion?: string;
  fecha_envio?: string;
  fecha_revision?: string;
  fecha_aprobacion?: string;
  observaciones?: string;
  version: number;
}

// Tipos para Revisiones
export interface Revision {
  id?: number;
  proyecto_id: number;
  revisor_id: number;
  tipo_revision: 'inicial' | 'intermedia' | 'final';
  comentarios: string;
  criterios_evaluacion?: string; // JSON string
  puntaje_total?: number;
  recomendacion: 'aprobado' | 'rechazado' | 'corregir';
  fecha_revision?: string;
}

// Tipos para Archivos
export interface ArchivoProyecto {
  id?: number;
  proyecto_id: number;
  nombre_archivo: string;
  nombre_original: string;
  tipo_archivo: 'documento' | 'imagen' | 'presentacion' | 'otro';
  ruta_archivo: string;
  tamaño_bytes: number;
  descripcion?: string;
  fecha_subida?: string;
  version: number;
}

// Tipos para Comentarios
export interface Comentario {
  id?: number;
  proyecto_id: number;
  usuario_id: number;
  comentario: string;
  tipo_comentario: 'general' | 'correccion' | 'pregunta' | 'respuesta';
  comentario_padre_id?: number;
  fecha_comentario?: string;
  editado: number;
  fecha_edicion?: string;
}

// Tipos para Historial
export interface HistorialProyecto {
  id?: number;
  proyecto_id: number;
  usuario_id: number;
  accion: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  descripcion?: string;
  fecha_accion?: string;
}

// Tipos para Notificaciones
export interface Notificacion {
  id?: number;
  usuario_id: number;
  proyecto_id?: number;
  tipo_notificacion: 'revision' | 'aprobacion' | 'rechazo' | 'comentario' | 'asignacion';
  titulo: string;
  mensaje: string;
  leida: number;
  fecha_creacion?: string;
  fecha_lectura?: string;
}

// Tipos para Asignaciones
export interface AsignacionTutor {
  id?: number;
  proyecto_id: number;
  tutor_id: number;
  fecha_asignacion?: string;
  activa: number;
  observaciones?: string;
}

// Tipos para JWT
export interface JwtPayload {
  id: number;
  email: string;
  rol: string;
}

// Tipos para Request extendido
import { Request } from 'express';

export interface AuthRequest extends Request {
  usuario?: UsuarioSinPassword;
}

