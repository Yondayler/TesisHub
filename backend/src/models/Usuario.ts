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
    if (datos.email) {
      campos.push('email = ?');
      valores.push(datos.email);
    }
    if (datos.password) {
      // Si se actualiza la contraseña, hay que hashearla
      const hashedPassword = await bcrypt.hash(datos.password, 10);
      campos.push('password = ?');
      valores.push(hashedPassword);
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

  // Contar usuarios por rol
  static async contarPorRol(rol: string): Promise<number> {
    const result = await query.get(
      `SELECT COUNT(*) as total FROM usuarios WHERE rol = ? AND activo = 1`,
      [rol]
    ) as { total: number } | undefined;
    
    return result?.total || 0;
  }

  // Contar nuevos estudiantes del mes actual
  static async contarNuevosEstudiantes(): Promise<number> {
    const result = await query.get(
      `SELECT COUNT(*) as total 
       FROM usuarios 
       WHERE rol = 'estudiante' 
       AND activo = 1 
       AND strftime('%Y-%m', fecha_registro) = strftime('%Y-%m', 'now')`,
      []
    ) as { total: number } | undefined;
    
    return result?.total || 0;
  }

  // Contar nuevos estudiantes del mes anterior
  static async contarNuevosEstudiantesMesAnterior(): Promise<number> {
    const result = await query.get(
      `SELECT COUNT(*) as total 
       FROM usuarios 
       WHERE rol = 'estudiante' 
       AND activo = 1 
       AND strftime('%Y-%m', fecha_registro) = strftime('%Y-%m', date('now', '-1 month'))`,
      []
    ) as { total: number } | undefined;
    
    return result?.total || 0;
  }

  // Eliminar usuario (solo tutores o administradores)
  static async eliminar(id: number, rolPermitido?: 'tutor' | 'administrador'): Promise<void> {
    // Verificar que el usuario existe
    const usuario = await this.obtenerPorId(id);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    // Si se especifica un rol permitido, verificar que el usuario tenga ese rol
    if (rolPermitido && usuario.rol !== rolPermitido) {
      throw new Error(`Solo se pueden eliminar ${rolPermitido}s`);
    }

    // Eliminar el usuario
    await query.run(
      `DELETE FROM usuarios WHERE id = ?`,
      [id]
    );
  }
}

