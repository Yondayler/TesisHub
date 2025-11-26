import { api } from './api';

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

export const archivoService = {
  // Subir archivo a un proyecto
  async subirArchivo(
    proyectoId: number,
    archivo: File,
    descripcion?: string,
    categoria?: 'diagnostico' | 'antecedentes' | 'objetivos' | 'otro'
  ): Promise<ArchivoProyecto> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }
    if (categoria) {
      formData.append('categoria', categoria);
    }

    const response = await api.post(`/proyectos/${proyectoId}/archivos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Obtener archivos de un proyecto
  async obtenerArchivosPorProyecto(proyectoId: number): Promise<ArchivoProyecto[]> {
    const response = await api.get(`/proyectos/${proyectoId}/archivos`);
    return response.data.data;
  },

  // Descargar archivo
  async descargarArchivo(archivoId: number): Promise<Blob> {
    const response = await api.get(`/archivos/${archivoId}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Eliminar archivo
  async eliminarArchivo(archivoId: number): Promise<void> {
    await api.delete(`/archivos/${archivoId}`);
  },
};
