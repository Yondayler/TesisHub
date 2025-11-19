export interface Usuario {
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

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  usuario: Usuario;
}

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

export interface EstadisticasProyecto {
  total: number;
  borradores: number;
  enviados: number;
  en_revision: number;
  aprobados: number;
  rechazados: number;
  corregir: number;
}
