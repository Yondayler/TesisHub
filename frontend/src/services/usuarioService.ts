import { api } from './api';
import { Usuario } from '../types';

export interface CrearTutorData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export interface CrearAdministradorData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export interface ActualizarAdministradorData {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  activo?: number;
}

export const usuarioService = {
  // Crear tutor
  async crearTutor(datos: CrearTutorData): Promise<Usuario> {
    try {
      const response = await api.post('/usuarios/tutores', datos);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al crear el tutor');
    } catch (error: any) {
      // Propagar el error con el mensaje del backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  // Obtener todos los estudiantes
  async obtenerEstudiantes(): Promise<Usuario[]> {
    const response = await api.get('/usuarios/estudiantes');
    return response.data.data;
  },

  // Obtener todos los tutores
  async obtenerTutores(): Promise<Usuario[]> {
    const response = await api.get('/usuarios/tutores');
    return response.data.data;
  },

  // Obtener usuario por ID
  async obtenerUsuarioPorId(id: number): Promise<Usuario> {
    const response = await api.get(`/usuarios/${id}`);
    return response.data.data;
  },

  // Eliminar tutor
  async eliminarTutor(id: number): Promise<void> {
    await api.delete(`/usuarios/tutores/${id}`);
  },

  // Verificar si un email ya existe
  async verificarEmail(email: string): Promise<boolean> {
    try {
      const response = await api.get(`/usuarios/verificar-email/${encodeURIComponent(email)}`);
      return response.data.data?.existe || false;
    } catch (error: any) {
      // Si hay error, asumimos que el email no existe para no bloquear al usuario
      console.error('Error al verificar email:', error);
      return false;
    }
  },

  // Obtener todos los administradores
  async obtenerAdministradores(): Promise<Usuario[]> {
    const response = await api.get('/usuarios/administradores');
    return response.data.data;
  },

  // Crear administrador
  async crearAdministrador(datos: CrearAdministradorData): Promise<Usuario> {
    try {
      const response = await api.post('/usuarios/administradores', datos);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al crear el administrador');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  // Actualizar administrador
  async actualizarAdministrador(id: number, datos: ActualizarAdministradorData): Promise<Usuario> {
    try {
      const response = await api.put(`/usuarios/administradores/${id}`, datos);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Error al actualizar el administrador');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  // Eliminar administrador
  async eliminarAdministrador(id: number): Promise<void> {
    await api.delete(`/usuarios/administradores/${id}`);
  },
};





