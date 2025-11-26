import api from './api';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  // Registrar nuevo usuario
  async registrar(datos: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/registro', datos);
      if (response.data.success && response.data.data) {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.data.usuario));
        return response.data.data;
      }
      throw new Error(response.data.message || response.data.error || 'Error al registrar usuario');
    } catch (error: any) {
      // Extraer mensaje de error del backend
      // El backend puede devolver error como string o como objeto { message: "..." }
      let errorMessage = 'Error al registrar usuario';
      
      if (error.response?.data) {
        // Si error es un objeto con message, extraer el message
        if (typeof error.response.data.error === 'object' && error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = typeof error.message === 'string' ? error.message : String(error.message);
      }
      
      throw new Error(errorMessage);
    }
  },

  // Iniciar sesión
  async login(datos: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', datos);
      if (response.data.success && response.data.data) {
        // Guardar token y usuario en localStorage SOLO si el login fue exitoso
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('usuario', JSON.stringify(response.data.data.usuario));
        return response.data.data;
      }
      throw new Error(response.data.message || response.data.error || 'Error al iniciar sesión');
    } catch (error: any) {
      // NO guardar NADA en localStorage si hay error
      // Extraer mensaje de error del backend y crear un nuevo Error con el mensaje como string
      // El backend puede devolver error como string o como objeto { message: "..." }
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.data) {
        // Si error es un objeto con message, extraer el message
        if (typeof error.response.data.error === 'object' && error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = typeof error.message === 'string' ? error.message : String(error.message);
      }
      
      // Crear un nuevo Error con el mensaje como string para evitar problemas de renderizado
      const newError = new Error(String(errorMessage));
      // Preservar la información de respuesta si existe
      if (error.response) {
        (newError as any).response = error.response;
      }
      throw newError;
    }
  },

  // Obtener perfil del usuario autenticado
  async obtenerPerfil(): Promise<AuthResponse['usuario']> {
    const response = await api.get<ApiResponse<AuthResponse['usuario']>>('/auth/perfil');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Error al obtener perfil');
  },

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  // Verificar si hay un usuario autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  // Obtener usuario del localStorage
  getUsuario(): AuthResponse['usuario'] | null {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        return JSON.parse(usuarioStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};





