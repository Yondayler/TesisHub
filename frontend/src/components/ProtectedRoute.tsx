import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'estudiante' | 'tutor' | 'administrador';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, usuario, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && usuario?.rol !== requiredRole) {
    // Redirigir al dashboard correcto según el rol del usuario en lugar de "/" para evitar loops
    if (usuario) {
      switch (usuario.rol) {
        case 'estudiante':
          return <Navigate to="/dashboard-usuario" replace />;
        case 'tutor':
          return <Navigate to="/dashboard-tutor" replace />;
        case 'administrador':
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};








