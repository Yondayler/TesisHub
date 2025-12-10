import { api } from './api';
import { Proyecto } from './proyectoService';

export interface EstudianteTutorizado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  cedula?: string;
  telefono?: string;
  total_proyectos: number;
  proyectos_borrador: number;
  proyectos_enviados: number;
  proyectos_en_revision: number;
  proyectos_aprobados: number;
  proyectos_rechazados: number;
  proyectos_corregir: number;
}

export const tutorService = {
  // Obtener estudiantes tutorizados
  async obtenerEstudiantesTutorizados(): Promise<EstudianteTutorizado[]> {
    const response = await api.get('/tutores/estudiantes');
    return response.data.data;
  },

  // Obtener proyectos de un estudiante específico
  async obtenerProyectosPorEstudiante(estudianteId: number): Promise<Proyecto[]> {
    const response = await api.get(`/tutores/estudiantes/${estudianteId}/proyectos`);
    return response.data.data;
  },
};




