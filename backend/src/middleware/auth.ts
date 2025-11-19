import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, AuthRequest } from '../types';
import { sendError } from '../utils/response';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Token de autenticación no proporcionado', 401);
      return;
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    (req as AuthRequest).usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol as any,
    } as any;

    next();
  } catch (error) {
    sendError(res, 'Token inválido o expirado', 401);
  }
};

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const usuario = (req as AuthRequest).usuario;

    if (!usuario) {
      sendError(res, 'Usuario no autenticado', 401);
      return;
    }

    if (!roles.includes(usuario.rol)) {
      sendError(res, 'No tienes permisos para realizar esta acción', 403);
      return;
    }

    next();
  };
};


