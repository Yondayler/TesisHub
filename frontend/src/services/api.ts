import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '../types';

// Detectar automáticamente la URL del backend en producción
const getApiUrl = (): string => {
  // Si está definida en variables de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // En producción, detectar automáticamente basándose en el dominio
  if (import.meta.env.PROD) {
    // Si estamos en Render, el backend estará en el mismo dominio base
    // Ejemplo: si frontend es tesis-hub-frontend.onrender.com
    // entonces backend es tesis-hub-backend.onrender.com
    const hostname = window.location.hostname;

    // Si es un dominio de Render
    if (hostname.includes('onrender.com')) {
      // Extraer el nombre del servicio del frontend
      const frontendName = hostname.split('.')[0];
      // Construir el nombre del backend (asumiendo naming convention)
      const backendName = frontendName.replace('-frontend', '-backend');
      return `https://${backendName}.onrender.com/api`;
    }

    // Fallback: usar el mismo dominio con puerto 3000
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  // Desarrollo local
  return 'http://localhost:3000/api';
};

export const API_URL = getApiUrl();

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    // Solo redirigir en caso de 401 si NO es un intento de login o registro
    // (los endpoints de autenticación deben manejar sus propios errores)
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/registro');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expirado o inválido - solo para usuarios ya autenticados
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;

