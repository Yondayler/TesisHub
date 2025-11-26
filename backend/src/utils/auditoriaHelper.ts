import { AuditoriaService } from '../services/auditoriaService';
import { Auditoria } from '../types';

/**
 * Helper para registrar acciones en la auditoría
 */
export async function registrarAuditoria(
  administradorId: number,
  accion: string,
  entidad: string,
  entidadId?: number,
  detalles?: string,
  datosAnteriores?: any,
  datosNuevos?: any
): Promise<void> {
  try {
    await AuditoriaService.registrar({
      administrador_id: administradorId,
      accion,
      entidad,
      entidad_id: entidadId,
      detalles,
      datos_anteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : undefined,
      datos_nuevos: datosNuevos ? JSON.stringify(datosNuevos) : undefined,
    });
  } catch (error) {
    // No fallar si hay error en auditoría, solo loguear
    console.error('Error al registrar auditoría:', error);
  }
}

