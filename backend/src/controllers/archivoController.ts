import { Request, Response, NextFunction } from 'express';
import { ArchivoService } from '../services/archivoService';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';

export class ArchivoController {
  // Subir archivo
  static async subirArchivo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        sendError(res, 'Usuario no autenticado', 401);
        return;
      }

      const proyectoId = parseInt(req.params.proyectoId);
      if (isNaN(proyectoId)) {
        sendError(res, 'ID de proyecto inválido', 400);
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 'No se proporcionó ningún archivo', 400);
        return;
      }

      const descripcion = req.body.descripcion;
      const categoria = req.body.categoria;

      const archivo = await ArchivoService.subirArchivo(proyectoId, file, descripcion, categoria);

      sendSuccess(res, archivo, 'Archivo subido exitosamente', 201);
    } catch (error: any) {
      next(error);
    }
  }

  // Obtener archivos por proyecto
  static async obtenerArchivosPorProyecto(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        sendError(res, 'Usuario no autenticado', 401);
        return;
      }

      const proyectoId = parseInt(req.params.proyectoId);
      if (isNaN(proyectoId)) {
        sendError(res, 'ID de proyecto inválido', 400);
        return;
      }

      const archivos = await ArchivoService.obtenerArchivosPorProyecto(proyectoId);

      sendSuccess(res, archivos, 'Archivos obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // Descargar archivo
  static async descargarArchivo(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        sendError(res, 'Usuario no autenticado', 401);
        return;
      }

      const archivoId = parseInt(req.params.id);
      if (isNaN(archivoId)) {
        sendError(res, 'ID de archivo inválido', 400);
        return;
      }

      const archivo = await ArchivoService.obtenerArchivoPorId(archivoId);

      if (!fs.existsSync(archivo.ruta_archivo)) {
        sendError(res, 'El archivo físico no existe', 404);
        return;
      }

      res.download(archivo.ruta_archivo, archivo.nombre_original, (err) => {
        if (err) {
          next(err);
        }
      });
    } catch (error: any) {
      next(error);
    }
  }

  // Eliminar archivo
  static async eliminarArchivo(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        sendError(res, 'Usuario no autenticado', 401);
        return;
      }

      const archivoId = parseInt(req.params.id);
      if (isNaN(archivoId)) {
        sendError(res, 'ID de archivo inválido', 400);
        return;
      }

      await ArchivoService.eliminarArchivo(archivoId);

      sendSuccess(res, null, 'Archivo eliminado exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}



