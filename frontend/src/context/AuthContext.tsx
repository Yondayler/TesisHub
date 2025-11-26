import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  registro: (datos: any) => Promise<Usuario>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario guardado solo al montar el componente
    const usuarioGuardado = authService.getUsuario();
    const tokenGuardado = localStorage.getItem('token');
    if (usuarioGuardado && authService.isAuthenticated()) {
      setUsuario(usuarioGuardado);
      setToken(tokenGuardado);
      // Verificar token con el backend en segundo plano (sin bloquear la UI)
      // Solo si no hay un usuario ya establecido (para evitar re-renders después del login)
      authService.obtenerPerfil()
        .then((perfil) => {
          // Actualizar usuario solo si el perfil es diferente
          if (perfil && JSON.stringify(perfil) !== JSON.stringify(usuarioGuardado)) {
            setUsuario(perfil);
            localStorage.setItem('usuario', JSON.stringify(perfil));
          }
        })
        .catch(() => {
          // Solo limpiar si el token es inválido
          authService.logout();
          setUsuario(null);
          setToken(null);
        });
    } else {
      // Si no hay usuario, asegurarse de que el estado esté limpio
      setUsuario(null);
      setToken(null);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<Usuario> => {
    try {
      const response = await authService.login({ email, password });
      // Solo actualizar el estado si el login fue exitoso
      setUsuario(response.usuario);
      const tokenGuardado = localStorage.getItem('token');
      setToken(tokenGuardado);
      return response.usuario;
    } catch (error) {
      // NO modificar el estado si el login falla
      // Esto evita que el componente se desmonte y vuelva a montar
      // El usuario ya estaba en null, no hay necesidad de cambiarlo
      throw error; // Re-lanzar el error para que el componente lo maneje
    }
  };

  const registro = async (datos: any): Promise<Usuario> => {
    const response = await authService.registrar(datos);
    setUsuario(response.usuario);
    const tokenGuardado = localStorage.getItem('token');
    setToken(tokenGuardado);
    return response.usuario;
  };

  const logout = () => {
    authService.logout();
    setUsuario(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        loading,
        login,
        registro,
        logout,
        isAuthenticated: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};


