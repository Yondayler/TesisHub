import { UsuarioModel } from '../models/Usuario';
import { Usuario, UsuarioSinPassword } from '../types';
import { AppError } from '../utils/errors';

export class UsuarioService {
  // Crear tutor (solo administradores)
  static async crearTutor(datos: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
  }): Promise<UsuarioSinPassword> {
    // Verificar si el email ya existe
    const usuarioExistente = await UsuarioModel.obtenerPorEmail(datos.email);
    if (usuarioExistente) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear tutor
    const tutorId = await UsuarioModel.crear({
      email: datos.email,
      password: datos.password,
      nombre: datos.nombre,
      apellido: datos.apellido,
      rol: 'tutor',
      activo: 1,
    });

    const tutor = await UsuarioModel.obtenerPorId(tutorId);
    if (!tutor) {
      throw new AppError('Error al crear el tutor', 500);
    }

    return tutor;
  }

  // Obtener todos los estudiantes
  static async obtenerEstudiantes(): Promise<UsuarioSinPassword[]> {
    const usuarios = await UsuarioModel.listar();
    return usuarios.filter(usuario => usuario.rol === 'estudiante');
  }

  // Obtener todos los tutores
  static async obtenerTutores(): Promise<UsuarioSinPassword[]> {
    const usuarios = await UsuarioModel.listar();
    return usuarios.filter(usuario => usuario.rol === 'tutor');
  }

  // Obtener usuario por ID
  static async obtenerUsuarioPorId(id: number): Promise<UsuarioSinPassword> {
    const usuario = await UsuarioModel.obtenerPorId(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return usuario;
  }

  // Verificar si un email ya existe
  static async verificarEmail(email: string): Promise<boolean> {
    const usuario = await UsuarioModel.obtenerPorEmail(email);
    return !!usuario;
  }

  // Eliminar tutor (solo administradores)
  static async eliminarTutor(id: number): Promise<void> {
    // Verificar que el tutor existe
    const tutor = await UsuarioModel.obtenerPorId(id);
    if (!tutor) {
      throw new AppError('Tutor no encontrado', 404);
    }
    if (tutor.rol !== 'tutor') {
      throw new AppError('Solo se pueden eliminar tutores', 400);
    }

    // Eliminar el tutor
    await UsuarioModel.eliminar(id, 'tutor');
  }

  // Obtener todos los administradores
  static async obtenerAdministradores(): Promise<UsuarioSinPassword[]> {
    const usuarios = await UsuarioModel.listar();
    return usuarios.filter(usuario => usuario.rol === 'administrador');
  }

  // Crear administrador (solo administradores)
  static async crearAdministrador(datos: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
  }): Promise<UsuarioSinPassword> {
    // Verificar si el email ya existe
    const usuarioExistente = await UsuarioModel.obtenerPorEmail(datos.email);
    if (usuarioExistente) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear administrador
    const adminId = await UsuarioModel.crear({
      email: datos.email,
      password: datos.password,
      nombre: datos.nombre,
      apellido: datos.apellido,
      rol: 'administrador',
      activo: 1,
    });

    const admin = await UsuarioModel.obtenerPorId(adminId);
    if (!admin) {
      throw new AppError('Error al crear el administrador', 500);
    }

    return admin;
  }

  // Actualizar administrador (solo administradores)
  static async actualizarAdministrador(id: number, datos: {
    nombre?: string;
    apellido?: string;
    email?: string;
    password?: string;
    activo?: number;
  }): Promise<UsuarioSinPassword> {
    // Verificar que el administrador existe
    const admin = await UsuarioModel.obtenerPorId(id);
    if (!admin) {
      throw new AppError('Administrador no encontrado', 404);
    }
    if (admin.rol !== 'administrador') {
      throw new AppError('Solo se pueden actualizar administradores', 400);
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (datos.email && datos.email !== admin.email) {
      const usuarioExistente = await UsuarioModel.obtenerPorEmail(datos.email);
      if (usuarioExistente) {
        throw new AppError('El email ya está registrado', 400);
      }
    }

    // Preparar datos para actualizar
    const datosActualizacion: Partial<Usuario> = {};
    if (datos.nombre) datosActualizacion.nombre = datos.nombre;
    if (datos.apellido) datosActualizacion.apellido = datos.apellido;
    if (datos.email) datosActualizacion.email = datos.email;
    if (datos.password) datosActualizacion.password = datos.password;
    if (datos.activo !== undefined) datosActualizacion.activo = datos.activo;

    // Actualizar usuario
    await UsuarioModel.actualizar(id, datosActualizacion);

    // Obtener y retornar el administrador actualizado
    const adminActualizado = await UsuarioModel.obtenerPorId(id);
    if (!adminActualizado) {
      throw new AppError('Error al actualizar el administrador', 500);
    }

    return adminActualizado;
  }

  // Eliminar administrador (solo administradores)
  static async eliminarAdministrador(id: number): Promise<void> {
    // Verificar que el administrador existe
    const admin = await UsuarioModel.obtenerPorId(id);
    if (!admin) {
      throw new AppError('Administrador no encontrado', 404);
    }
    if (admin.rol !== 'administrador') {
      throw new AppError('Solo se pueden eliminar administradores', 400);
    }

    // Eliminar el administrador
    await UsuarioModel.eliminar(id, 'administrador');
  }
}





