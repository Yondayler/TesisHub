import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UsuarioModel } from '../models/Usuario';
import { Usuario, JwtPayload } from '../types';
import { AppError } from '../utils/errors';

export class AuthService {
  // Generar token JWT
  static generarToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );
  }

  // Registrar nuevo usuario
  static async registrar(datos: Usuario): Promise<{ usuario: any; token: string }> {
    // Verificar si el email ya existe
    const usuarioExistente = await UsuarioModel.obtenerPorEmail(datos.email);
    if (usuarioExistente) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear usuario
    const usuarioId = await UsuarioModel.crear(datos);
    const usuario = await UsuarioModel.obtenerPorId(usuarioId);

    if (!usuario) {
      throw new AppError('Error al crear el usuario', 500);
    }

    // Generar token
    const token = this.generarToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return { usuario, token };
  }

  // Iniciar sesión
  static async login(email: string, password: string): Promise<{ usuario: any; token: string }> {
    // Buscar usuario
    const usuario = await UsuarioModel.obtenerPorEmail(email);
    if (!usuario) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const passwordValido = await UsuarioModel.verificarPassword(password, usuario.password);
    if (!passwordValido) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar si está activo
    if (usuario.activo === 0) {
      throw new AppError('Usuario inactivo', 403);
    }

    // Actualizar último acceso
    await UsuarioModel.actualizarUltimoAcceso(usuario.id!);

    // Obtener usuario sin password
    const usuarioSinPassword = await UsuarioModel.obtenerPorId(usuario.id!);

    // Generar token
    const token = this.generarToken({
      id: usuario.id!,
      email: usuario.email,
      rol: usuario.rol,
    });

    return { usuario: usuarioSinPassword, token };
  }
}

