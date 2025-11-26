import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardRedirect = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir según el rol del usuario
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
};

