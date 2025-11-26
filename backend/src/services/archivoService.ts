import { ArchivoProyectoModel } from '../models/ArchivoProyecto';
import { ArchivoProyecto } from '../types';
import { AppError } from '../utils/errors';
import path from 'path';
import fs from 'fs';

export class ArchivoService {
  // Subir archivo
  static async subirArchivo(
    proyectoId: number,
    file: Express.Multer.File,
    descripcion?: string,
    categoria?: 'diagnostico' | 'antecedentes' | 'objetivos' | 'otro'
  ): Promise<ArchivoProyecto> {
    // Obtener última versión del archivo si existe
    const ultimaVersion = await ArchivoProyectoModel.obtenerUltimaVersion(
      proyectoId,
      file.originalname
    );
    const nuevaVersion = ultimaVersion + 1;

    // Determinar tipo de archivo
    const tipoArchivo = this.getTipoArchivo(file.mimetype);

    // Crear registro en base de datos
    const archivoId = await ArchivoProyectoModel.crear({
      proyecto_id: proyectoId,
      nombre_archivo: file.filename,
      nombre_original: file.originalname,
      tipo_archivo: tipoArchivo,
      ruta_archivo: file.path,
      tamaño_bytes: file.size,
      descripcion: descripcion,
      version: nuevaVersion,
      categoria: categoria,
    });

    const archivo = await ArchivoProyectoModel.obtenerPorId(archivoId);
    if (!archivo) {
      throw new AppError('Error al crear el registro del archivo', 500);
    }

    return archivo;
  }

  // Obtener archivos por proyecto
  static async obtenerArchivosPorProyecto(proyectoId: number): Promise<ArchivoProyecto[]> {
    return await ArchivoProyectoModel.obtenerPorProyecto(proyectoId);
  }

  // Obtener archivo por ID
  static async obtenerArchivoPorId(id: number): Promise<ArchivoProyecto> {
    const archivo = await ArchivoProyectoModel.obtenerPorId(id);
    if (!archivo) {
      throw new AppError('Archivo no encontrado', 404);
    }
    return archivo;
  }

  // Eliminar archivo
  static async eliminarArchivo(id: number): Promise<void> {
    const archivo = await ArchivoProyectoModel.obtenerPorId(id);
    if (!archivo) {
      throw new AppError('Archivo no encontrado', 404);
    }

    // Eliminar archivo físico
    if (fs.existsSync(archivo.ruta_archivo)) {
      fs.unlinkSync(archivo.ruta_archivo);
    }

    // Eliminar registro de base de datos
    const eliminado = await ArchivoProyectoModel.eliminar(id);
    if (!eliminado) {
      throw new AppError('Error al eliminar el archivo', 500);
    }
  }

  // Helper para determinar tipo de archivo
  private static getTipoArchivo(mimetype: string): 'documento' | 'imagen' | 'presentacion' | 'otro' {
    if (mimetype.includes('pdf') || mimetype.includes('word') || mimetype.includes('document')) {
      return 'documento';
    }
    if (mimetype.includes('image')) {
      return 'imagen';
    }
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) {
      return 'presentacion';
    }
    return 'otro';
  }
}



