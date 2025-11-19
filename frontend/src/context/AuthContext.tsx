import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (datos: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario guardado
    const usuarioGuardado = authService.getUsuario();
    if (usuarioGuardado && authService.isAuthenticated()) {
      setUsuario(usuarioGuardado);
      // Opcional: verificar token con el backend
      authService.obtenerPerfil().catch(() => {
        authService.logout();
        setUsuario(null);
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUsuario(response.usuario);
  };

  const registro = async (datos: any) => {
    const response = await authService.registrar(datos);
    setUsuario(response.usuario);
  };

  const logout = () => {
    authService.logout();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
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


