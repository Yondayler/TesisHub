import { Request, Response, NextFunction } from 'express';
import { UsuarioService } from '../services/usuarioService';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { registrarAuditoria } from '../utils/auditoriaHelper';

export class UsuarioController {
  // POST /api/usuarios/tutores - Crear tutor (solo administradores)
  static async crearTutor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const { email, password, nombre, apellido } = req.body;

      if (!email || !password || !nombre || !apellido) {
        sendError(res, 'Faltan campos requeridos: email, password, nombre, apellido', 400);
        return;
      }

      const tutor = await UsuarioService.crearTutor({
        email,
        password,
        nombre,
        apellido,
      });

      // Registrar en auditoría
      await registrarAuditoria(
        usuario.id!,
        'CREAR',
        'TUTOR',
        tutor.id,
        `Tutor creado: ${tutor.nombre} ${tutor.apellido} (${tutor.email})`,
        undefined,
        { email: tutor.email, nombre: tutor.nombre, apellido: tutor.apellido }
      );

      sendSuccess(res, tutor, 'Tutor creado exitosamente', 201);
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/usuarios/estudiantes - Obtener todos los estudiantes (solo administradores)
  static async obtenerEstudiantes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const estudiantes = await UsuarioService.obtenerEstudiantes();

      sendSuccess(res, estudiantes, 'Estudiantes obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/usuarios/tutores - Obtener todos los tutores (solo administradores)
  static async obtenerTutores(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const tutores = await UsuarioService.obtenerTutores();

      sendSuccess(res, tutores, 'Tutores obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/usuarios/:id - Obtener usuario por ID (solo administradores)
  static async obtenerUsuario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'ID inválido', 400);
        return;
      }

      const usuarioEncontrado = await UsuarioService.obtenerUsuarioPorId(id);

      sendSuccess(res, usuarioEncontrado, 'Usuario obtenido exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/usuarios/verificar-email/:email - Verificar si un email existe
  static async verificarEmail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const email = req.params.email;
      if (!email) {
        sendError(res, 'Email requerido', 400);
        return;
      }

      const emailExiste = await UsuarioService.verificarEmail(email);

      sendSuccess(res, { existe: emailExiste }, emailExiste ? 'El email ya está registrado' : 'El email está disponible');
    } catch (error: any) {
      next(error);
    }
  }

  // DELETE /api/usuarios/tutores/:id - Eliminar tutor (solo administradores)
  static async eliminarTutor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'ID inválido', 400);
        return;
      }

      // Obtener datos del tutor antes de eliminarlo para auditoría
      const tutorEliminado = await UsuarioService.obtenerUsuarioPorId(id);
      
      await UsuarioService.eliminarTutor(id);

      // Registrar en auditoría
      if (tutorEliminado) {
        await registrarAuditoria(
          usuario.id!,
          'ELIMINAR',
          'TUTOR',
          id,
          `Tutor eliminado: ${tutorEliminado.nombre} ${tutorEliminado.apellido} (${tutorEliminado.email})`,
          { email: tutorEliminado.email, nombre: tutorEliminado.nombre, apellido: tutorEliminado.apellido },
          undefined
        );
      }

      sendSuccess(res, null, 'Tutor eliminado exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // GET /api/usuarios/administradores - Obtener todos los administradores (solo administradores)
  static async obtenerAdministradores(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const administradores = await UsuarioService.obtenerAdministradores();

      sendSuccess(res, administradores, 'Administradores obtenidos exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // POST /api/usuarios/administradores - Crear administrador (solo administradores)
  static async crearAdministrador(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const { email, password, nombre, apellido } = req.body;

      if (!email || !password || !nombre || !apellido) {
        sendError(res, 'Faltan campos requeridos: email, password, nombre, apellido', 400);
        return;
      }

      const admin = await UsuarioService.crearAdministrador({
        email,
        password,
        nombre,
        apellido,
      });

      // Registrar en auditoría
      await registrarAuditoria(
        usuario.id!,
        'CREAR',
        'ADMINISTRADOR',
        admin.id,
        `Administrador creado: ${admin.nombre} ${admin.apellido} (${admin.email})`,
        undefined,
        { email: admin.email, nombre: admin.nombre, apellido: admin.apellido }
      );

      sendSuccess(res, admin, 'Administrador creado exitosamente', 201);
    } catch (error: any) {
      next(error);
    }
  }

  // PUT /api/usuarios/administradores/:id - Actualizar administrador (solo administradores)
  static async actualizarAdministrador(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'ID inválido', 400);
        return;
      }

      const { nombre, apellido, email, password, activo } = req.body;

      // Obtener datos anteriores para auditoría
      const adminAnterior = await UsuarioService.obtenerUsuarioPorId(id);
      
      // No permitir editar el administrador inicial
      if (adminAnterior && adminAnterior.email === 'admin@tesishub.com') {
        sendError(res, 'No se puede editar el administrador principal del sistema', 400);
        return;
      }
      
      const admin = await UsuarioService.actualizarAdministrador(id, {
        nombre,
        apellido,
        email,
        password,
        activo,
      });

      // Registrar en auditoría
      if (adminAnterior) {
        const cambios: any = {};
        if (nombre && nombre !== adminAnterior.nombre) cambios.nombre = { anterior: adminAnterior.nombre, nuevo: nombre };
        if (apellido && apellido !== adminAnterior.apellido) cambios.apellido = { anterior: adminAnterior.apellido, nuevo: apellido };
        if (email && email !== adminAnterior.email) cambios.email = { anterior: adminAnterior.email, nuevo: email };
        if (password) cambios.password = '***actualizado***';
        if (activo !== undefined && activo !== adminAnterior.activo) cambios.activo = { anterior: adminAnterior.activo, nuevo: activo };

        if (Object.keys(cambios).length > 0) {
          await registrarAuditoria(
            usuario.id!,
            'ACTUALIZAR',
            'ADMINISTRADOR',
            id,
            `Administrador actualizado: ${admin.nombre} ${admin.apellido} (${admin.email})`,
            adminAnterior,
            cambios
          );
        }
      }

      sendSuccess(res, admin, 'Administrador actualizado exitosamente');
    } catch (error: any) {
      next(error);
    }
  }

  // DELETE /api/usuarios/administradores/:id - Eliminar administrador (solo administradores)
  static async eliminarAdministrador(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = req.usuario!;
      
      // Verificar que sea administrador
      if (usuario.rol !== 'administrador') {
        sendError(res, 'No tienes permiso para realizar esta acción', 403);
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 'ID inválido', 400);
        return;
      }

      // No permitir que un administrador se elimine a sí mismo
      if (id === usuario.id) {
        sendError(res, 'No puedes eliminar tu propia cuenta', 400);
        return;
      }

      // Obtener datos del administrador antes de eliminarlo para auditoría
      const adminEliminado = await UsuarioService.obtenerUsuarioPorId(id);
      
      // No permitir eliminar el administrador inicial
      if (adminEliminado && adminEliminado.email === 'admin@tesishub.com') {
        sendError(res, 'No se puede eliminar el administrador principal del sistema', 400);
        return;
      }
      
      await UsuarioService.eliminarAdministrador(id);

      // Registrar en auditoría
      if (adminEliminado) {
        await registrarAuditoria(
          usuario.id!,
          'ELIMINAR',
          'ADMINISTRADOR',
          id,
          `Administrador eliminado: ${adminEliminado.nombre} ${adminEliminado.apellido} (${adminEliminado.email})`,
          { email: adminEliminado.email, nombre: adminEliminado.nombre, apellido: adminEliminado.apellido },
          undefined
        );
      }

      sendSuccess(res, null, 'Administrador eliminado exitosamente');
    } catch (error: any) {
      next(error);
    }
  }
}





