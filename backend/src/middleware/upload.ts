import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const proyectoId = req.params.proyectoId || req.body.proyecto_id;
    const proyectoDir = path.join(uploadsDir, `proyecto-${proyectoId}`);
    
    if (!fs.existsSync(proyectoDir)) {
      fs.mkdirSync(proyectoDir, { recursive: true });
    }
    
    cb(null, proyectoDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generar nombre único: timestamp-nombreOriginal
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const filename = `${uniqueSuffix}-${nameWithoutExt}${ext}`;
    cb(null, filename);
  }
});

// Filtro de tipos de archivo permitidos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten PDF, Word, imágenes y presentaciones.'));
  }
};

// Configuración de multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  }
});

// Helper para determinar tipo de archivo
export function getTipoArchivo(mimetype: string): 'documento' | 'imagen' | 'presentacion' | 'otro' {
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






