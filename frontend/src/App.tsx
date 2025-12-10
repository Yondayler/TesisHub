import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Registro/Registro';
import { Dashboard as DashboardAdmin } from './pages/Dashboard Admin/Dashboard';
import { Dashboard as DashboardUsuario } from './pages/Dashboard Usuario/Dashboard';
import { Dashboard as DashboardTutor } from './pages/Dashboard Tutor/Dashboard';
import { DetallesProyecto } from './pages/Dashboard Usuario/DetallesProyecto';
import { Settings as SettingsUsuario } from './pages/Dashboard Usuario/Settings';
import { Documentacion } from './pages/Dashboard Usuario/Documentacion';
import { EstudiantesTutorizados } from './pages/Dashboard Tutor/EstudiantesTutorizados';
import { Settings as SettingsTutor } from './pages/Dashboard Tutor/Settings';
import { DashboardRedirect } from './components/DashboardRedirect';
import Canvas from './pages/Canvas/Canvas';

// Componente para redirigir si ya está autenticado
const PublicRoute = ({ children, allowRedirect = true }: { children: React.ReactNode; allowRedirect?: boolean }) => {
  const { isAuthenticated, usuario, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  // Solo redirigir si allowRedirect es true (para permitir animaciones de éxito)
  if (isAuthenticated && allowRedirect && usuario) {
    // Redirigir directamente al dashboard según el rol para evitar loops
    switch (usuario.rol) {
      case 'estudiante':
        return <Navigate to="/dashboard-usuario" replace />;
      case 'tutor':
        return <Navigate to="/dashboard-tutor" replace />;
      case 'administrador':
        return <Navigate to="/dashboard" replace />;
      default:
        return <>{children}</>;
    }
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute allowRedirect={false}>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard-usuario"
        element={
          <ProtectedRoute requiredRole="estudiante">
            <DashboardUsuario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-tutor"
        element={
          <ProtectedRoute requiredRole="tutor">
            <DashboardTutor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutores/estudiantes"
        element={
          <ProtectedRoute requiredRole="tutor">
            <EstudiantesTutorizados />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proyectos/:id"
        element={
          <ProtectedRoute>
            <DetallesProyecto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-usuario/settings"
        element={
          <ProtectedRoute requiredRole="estudiante">
            <SettingsUsuario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-tutor/settings"
        element={
          <ProtectedRoute requiredRole="tutor">
            <SettingsTutor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-usuario/documentacion"
        element={
          <ProtectedRoute requiredRole="estudiante">
            <Documentacion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="administrador">
            <DashboardAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/canvas"
        element={
          <ProtectedRoute requiredRole="estudiante">
            <Canvas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

