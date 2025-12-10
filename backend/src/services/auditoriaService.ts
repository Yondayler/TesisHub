import { AuditoriaModel } from '../models/Auditoria';
import { Auditoria } from '../types';

export class AuditoriaService {
  // Registrar una acción en la auditoría
  static async registrar(auditoria: Auditoria): Promise<number> {
    return await AuditoriaModel.crear(auditoria);
  }

  // Obtener todos los registros de auditoría
  static async obtenerTodos(limit?: number, offset?: number): Promise<Auditoria[]> {
    return await AuditoriaModel.listar(limit, offset);
  }

  // Obtener registros de auditoría por administrador
  static async obtenerPorAdministrador(administradorId: number, limit?: number, offset?: number): Promise<Auditoria[]> {
    return await AuditoriaModel.obtenerPorAdministrador(administradorId, limit, offset);
  }

  // Obtener registros de auditoría por entidad
  static async obtenerPorEntidad(entidad: string, entidadId?: number, limit?: number, offset?: number): Promise<Auditoria[]> {
    return await AuditoriaModel.obtenerPorEntidad(entidad, entidadId, limit, offset);
  }

  // Contar total de registros
  static async contar(): Promise<number> {
    return await AuditoriaModel.contar();
  }
}


