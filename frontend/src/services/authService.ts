import api from './api';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authService = {
  // Registrar nuevo usuario
  async registrar(datos: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/registro', datos);
    if (response.data.success && response.data.data) {
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.data.usuario));
      return response.data.data;
    }
    throw new Error(response.data.error || 'Error al registrar usuario');
  },

  // Iniciar sesión
  async login(datos: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', datos);
    if (response.data.success && response.data.data) {
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('usuario', JSON.stringify(response.data.data.usuario));
      return response.data.data;
    }
    throw new Error(response.data.error || 'Error al iniciar sesión');
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


