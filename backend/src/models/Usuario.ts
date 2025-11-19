import { query } from '../config/database';
import { Usuario, UsuarioSinPassword } from '../types';
import bcrypt from 'bcryptjs';

export class UsuarioModel {
  // Crear usuario
  static async crear(usuario: Usuario): Promise<number> {
    const hashedPassword = await bcrypt.hash(usuario.password, 10);
    
    const result = await query.run(
      `INSERT INTO usuarios (email, password, nombre, apellido, cedula, telefono, rol, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario.email,
        hashedPassword,
        usuario.nombre,
        usuario.apellido,
        usuario.cedula || null,
        usuario.telefono || null,
        usuario.rol,
        usuario.activo || 1,
      ]
    );

    return result.lastID;
  }

  // Obtener usuario por ID
  static async obtenerPorId(id: number): Promise<UsuarioSinPassword | null> {
    const usuario = await query.get(
      `SELECT id, email, nombre, apellido, cedula, telefono, rol, activo, fecha_registro, ultimo_acceso
       FROM usuarios WHERE id = ?`,
      [id]
    ) as UsuarioSinPassword | undefined;

    return usuario || null;
  }

  // Obtener usuario por email
  static async obtenerPorEmail(email: string): Promise<Usuario | null> {
    const usuario = await query.get(
      `SELECT * FROM usuarios WHERE email = ?`,
      [email]
    ) as Usuario | undefined;

    return usuario || null;
  }

  // Verificar contraseña
  static async verificarPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Actualizar último acceso
  static async actualizarUltimoAcceso(id: number): Promise<void> {
    await query.run(
      `UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }

  // Listar todos los usuarios
  static async listar(): Promise<UsuarioSinPassword[]> {
    const usuarios = await query.all(
      `SELECT id, email, nombre, apellido, cedula, telefono, rol, activo, fecha_registro, ultimo_acceso
       FROM usuarios ORDER BY fecha_registro DESC`
    ) as UsuarioSinPassword[];

    return usuarios;
  }

  // Actualizar usuario
  static async actualizar(id: number, datos: Partial<Usuario>): Promise<void> {
    const campos: string[] = [];
    const valores: any[] = [];

    if (datos.nombre) {
      campos.push('nombre = ?');
      valores.push(datos.nombre);
    }
    if (datos.apellido) {
      campos.push('apellido = ?');
      valores.push(datos.apellido);
    }
    if (datos.telefono) {
      campos.push('telefono = ?');
      valores.push(datos.telefono);
    }
    if (datos.rol) {
      campos.push('rol = ?');
      valores.push(datos.rol);
    }
    if (datos.activo !== undefined) {
      campos.push('activo = ?');
      valores.push(datos.activo);
    }

    if (campos.length === 0) return;

    valores.push(id);
    await query.run(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );
  }
}

