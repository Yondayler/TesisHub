import { api } from './api';

export interface Auditoria {
  id?: number;
  administrador_id: number;
  accion: string;
  entidad: string;
  entidad_id?: number;
  detalles?: string;
  datos_anteriores?: string;
  datos_nuevos?: string;
  fecha_accion?: string;
  administrador_nombre?: string;
  administrador_apellido?: string;
  administrador_email?: string;
}

export interface AuditoriaResponse {
  registros: Auditoria[];
  total: number;
}

export const auditoriaService = {
  // Obtener todos los registros de auditoría
  async obtenerTodos(limit?: number, offset?: number): Promise<AuditoriaResponse> {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await api.get('/auditoria', { params });
    return response.data.data;
  },

  // Obtener registros por administrador
  async obtenerPorAdministrador(administradorId: number, limit?: number, offset?: number): Promise<Auditoria[]> {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await api.get(`/auditoria/administrador/${administradorId}`, { params });
    return response.data.data;
  },

  // Obtener registros por entidad
  async obtenerPorEntidad(entidad: string, entidadId?: number, limit?: number, offset?: number): Promise<Auditoria[]> {
    const params: any = {};
    if (entidadId !== undefined) params.entidad_id = entidadId;
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    const response = await api.get(`/auditoria/entidad/${entidad}`, { params });
    return response.data.data;
  },
};

