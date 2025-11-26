import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../utils/errors';

export class AuthController {
  // Registrar nuevo usuario
  static async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, nombre, apellido, cedula, telefono, rol } = req.body;

      if (!email || !password || !nombre || !apellido) {
        sendError(res, 'Faltan campos requeridos', 400);
        return;
      }

      const resultado = await AuthService.registrar({
        email,
        password,
        nombre,
        apellido,
        cedula,
        telefono,
        rol: rol || 'estudiante',
        activo: 1,
      });

      sendSuccess(res, resultado, 'Usuario registrado exitosamente', 201);
    } catch (error: any) {
      next(error);
    }
  }

  // Iniciar sesión
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        sendError(res, 'Email y contraseña son requeridos', 400);
        return;
      }

      const resultado = await AuthService.login(email, password);

      sendSuccess(res, resultado, 'Inicio de sesión exitoso');
    } catch (error: any) {
      next(error);
    }
  }

  // Obtener perfil del usuario autenticado
  static async perfil(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = (req as any).usuario;

      if (!usuario) {
        sendError(res, 'Usuario no autenticado', 401);
        return;
      }

      sendSuccess(res, usuario, 'Perfil obtenido exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}










