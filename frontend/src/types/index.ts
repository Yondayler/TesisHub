export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  rol: 'estudiante' | 'tutor' | 'administrador';
  activo: number;
  fecha_registro?: string;
  ultimo_acceso?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  rol?: 'estudiante' | 'tutor' | 'administrador';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface Proyecto {
  id?: number;
  titulo: string;
  descripcion: string;
  planteamiento?: string;
  solucion_problema?: string;
  diagnosticos?: string;
  antecedentes?: string;
  objetivo_general?: string;
  objetivos_especificos?: string;
  justificacion?: string;
  metodologia?: string;
  resultados_esperados?: string;
  presupuesto_estimado?: number;
  duracion_meses?: number;
  estudiante_id: number;
  estudiante_nombre?: string;
  estudiante_apellido?: string;
  tutor_id?: number;
  tutor_nombre?: string;
  tutor_apellido?: string;
  estado: 'borrador' | 'enviado' | 'en_revision' | 'aprobado' | 'rechazado' | 'corregir';
  fecha_creacion?: string;
  fecha_envio?: string;
  fecha_revision?: string;
  fecha_aprobacion?: string;
  observaciones?: string;
  version: number;
}

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
  categoria?: 'diagnostico' | 'antecedentes' | 'objetivos' | 'otro';
}

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
  usuario_nombre?: string;
  usuario_apellido?: string;
  usuario_rol?: string;
  respuestas?: Comentario[];
}

export interface EstadisticasProyecto {
  total: number;
  borradores: number;
  enviados: number;
  en_revision: number;
  aprobados: number;
  rechazados: number;
  corregir: number;
}

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
  proyecto_titulo?: string;
}

export interface ObservacionProyecto {
  id?: number;
  proyecto_id: number;
  usuario_id: number;
  observacion: string;
  estado_proyecto: string;
  fecha_creacion?: string;
  usuario_nombre?: string;
  usuario_apellido?: string;
}
