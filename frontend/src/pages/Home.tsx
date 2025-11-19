import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { proyectoService } from '../services/proyectoService';
import { Proyecto, EstadisticasProyecto } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormularioProyecto } from '../components/FormularioProyecto';
import { TablaProyectos } from '../components/TablaProyectos';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  Plus, 
  LogOut, 
  User, 
  Settings, 
  CheckCircle2,
  Clock
} from 'lucide-react';

export const Home = () => {
  const { usuario, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasProyecto | null>(null);
  const [loadingProyectos, setLoadingProyectos] = useState(true);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [modoDialogo, setModoDialogo] = useState<'crear' | 'editar' | 'ver'>('crear');

  useEffect(() => {
    if (usuario) {
      cargarDatos();
    }
  }, [usuario]);

  const cargarDatos = async () => {
    try {
      setLoadingProyectos(true);
      const [proyectosData, estadisticasData] = await Promise.all([
        proyectoService.obtenerProyectos(),
        proyectoService.obtenerEstadisticas()
      ]);
      setProyectos(proyectosData);
      setEstadisticas(estadisticasData);
    } catch (error: any) {
      toast.error('Error al cargar datos', {
        description: error.response?.data?.message || 'No se pudieron cargar los datos'
      });
    } finally {
      setLoadingProyectos(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada', {
      description: 'Has cerrado sesión correctamente',
    });
    navigate('/login');
  };

  const handleCrearProyecto = async (proyecto: Partial<Proyecto>) => {
    try {
      await proyectoService.crearProyecto(proyecto);
      await cargarDatos();
      setDialogAbierto(false);
    } catch (error) {
      throw error;
    }
  };

  const handleActualizarProyecto = async (proyecto: Partial<Proyecto>) => {
    if (!proyectoSeleccionado?.id) return;
    
    try {
      await proyectoService.actualizarProyecto(proyectoSeleccionado.id, proyecto);
      await cargarDatos();
      setDialogAbierto(false);
      setProyectoSeleccionado(null);
    } catch (error) {
      throw error;
    }
  };

  const handleEnviarProyecto = async (proyecto: Proyecto) => {
    if (!proyecto.id) return;

    try {
      await proyectoService.cambiarEstado(proyecto.id, 'enviado');
      toast.success('Proyecto enviado', {
        description: 'El proyecto ha sido enviado para revisión'
      });
      await cargarDatos();
    } catch (error: any) {
      toast.error('Error al enviar proyecto', {
        description: error.response?.data?.message || 'No se pudo enviar el proyecto'
      });
    }
  };

  const handleEliminarProyecto = async (proyecto: Proyecto) => {
    if (!proyecto.id) return;

    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      return;
    }

    try {
      await proyectoService.eliminarProyecto(proyecto.id);
      toast.success('Proyecto eliminado', {
        description: 'El proyecto ha sido eliminado correctamente'
      });
      await cargarDatos();
    } catch (error: any) {
      toast.error('Error al eliminar proyecto', {
        description: error.response?.data?.message || 'No se pudo eliminar el proyecto'
      });
    }
  };

  const abrirDialogoCrear = () => {
    setModoDialogo('crear');
    setProyectoSeleccionado(null);
    setDialogAbierto(true);
  };

  const abrirDialogoEditar = (proyecto: Proyecto) => {
    setModoDialogo('editar');
    setProyectoSeleccionado(proyecto);
    setDialogAbierto(true);
  };

  const abrirDialogoVer = (proyecto: Proyecto) => {
    setModoDialogo('ver');
    setProyectoSeleccionado(proyecto);
    setDialogAbierto(true);
  };

  const cerrarDialogo = () => {
    setDialogAbierto(false);
    setTimeout(() => {
      setProyectoSeleccionado(null);
    }, 200);
  };

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'profesor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'estudiante':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-1/3 mx-auto" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-10 w-full mt-8" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50 animate-slide-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110 relative overflow-hidden">
                <FileText className="h-5 w-5 text-white relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Sistema de Proyectos
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block animate-fade-in">
                {usuario?.nombre} {usuario?.apellido}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                    <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-blue-500/20 transition-all">
                      <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700">
                        {usuario ? getInitials(usuario.nombre, usuario.apellido) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {usuario?.nombre} {usuario?.apellido}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {usuario?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-blue-50 transition-colors">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-blue-50 transition-colors">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer hover:bg-red-50 transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-default">
            Hola, {usuario?.nombre} 👋
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona tus proyectos y sigue el estado de tus solicitudes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default animate-fade-in hover-lift group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {loadingProyectos ? '...' : estadisticas?.total || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Proyectos</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default animate-fade-in hover-lift group" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En Revisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {loadingProyectos ? '...' : (estadisticas?.enviados || 0) + (estadisticas?.en_revision || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Pendientes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default animate-fade-in hover-lift group" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Aprobados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                {loadingProyectos ? '...' : estadisticas?.aprobados || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Completados</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default animate-fade-in hover-lift group" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors flex items-center gap-2">
                <User className="h-4 w-4" />
                Rol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 group-hover:scale-110 ${getRoleBadgeColor(usuario?.rol || '')}`}>
                {usuario?.rol}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="proyectos" className="space-y-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-6">
            <TabsTrigger
              value="proyectos"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Mis Proyectos
            </TabsTrigger>
            <TabsTrigger
              value="crear"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent hover:text-blue-600 hover:border-blue-300 transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Proyecto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proyectos" className="space-y-4 mt-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-scale-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Mis Proyectos</CardTitle>
                    <CardDescription className="text-sm">
                      Gestiona y revisa el estado de tus proyectos
                    </CardDescription>
                  </div>
                  <Button
                    onClick={abrirDialogoCrear}
                    className="group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Proyecto
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProyectos ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <TablaProyectos
                    proyectos={proyectos}
                    onVer={abrirDialogoVer}
                    onEditar={abrirDialogoEditar}
                    onEnviar={handleEnviarProyecto}
                    onEliminar={handleEliminarProyecto}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crear" className="space-y-4 mt-6">
            <FormularioProyecto onSubmit={handleCrearProyecto} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog para crear/editar/ver proyecto */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modoDialogo === 'crear' && 'Crear Nuevo Proyecto'}
              {modoDialogo === 'editar' && 'Editar Proyecto'}
              {modoDialogo === 'ver' && 'Detalles del Proyecto'}
            </DialogTitle>
            <DialogDescription>
              {modoDialogo === 'crear' && 'Completa el formulario con la información de tu proyecto'}
              {modoDialogo === 'editar' && 'Actualiza la información de tu proyecto'}
              {modoDialogo === 'ver' && 'Información detallada del proyecto'}
            </DialogDescription>
          </DialogHeader>
          {modoDialogo === 'ver' && proyectoSeleccionado ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Título</Label>
                <p className="text-gray-900 mt-1">{proyectoSeleccionado.titulo}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Descripción</Label>
                <p className="text-gray-600 mt-1">{proyectoSeleccionado.descripcion}</p>
              </div>
              {proyectoSeleccionado.objetivo_general && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Objetivo General</Label>
                  <p className="text-gray-600 mt-1">{proyectoSeleccionado.objetivo_general}</p>
                </div>
              )}
              {proyectoSeleccionado.objetivos_especificos && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Objetivos Específicos</Label>
                  <p className="text-gray-600 mt-1 whitespace-pre-line">{proyectoSeleccionado.objetivos_especificos}</p>
                </div>
              )}
              {proyectoSeleccionado.justificacion && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Justificación</Label>
                  <p className="text-gray-600 mt-1">{proyectoSeleccionado.justificacion}</p>
                </div>
              )}
              {proyectoSeleccionado.metodologia && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Metodología</Label>
                  <p className="text-gray-600 mt-1">{proyectoSeleccionado.metodologia}</p>
                </div>
              )}
              {proyectoSeleccionado.resultados_esperados && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Resultados Esperados</Label>
                  <p className="text-gray-600 mt-1">{proyectoSeleccionado.resultados_esperados}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {proyectoSeleccionado.presupuesto_estimado && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Presupuesto</Label>
                    <p className="text-gray-900 mt-1">{proyectoSeleccionado.presupuesto_estimado.toFixed(2)} Bs.</p>
                  </div>
                )}
                {proyectoSeleccionado.duracion_meses && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Duración</Label>
                    <p className="text-gray-900 mt-1">{proyectoSeleccionado.duracion_meses} meses</p>
                  </div>
                )}
              </div>
              {proyectoSeleccionado.observaciones && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Observaciones</Label>
                  <p className="text-gray-600 mt-1">{proyectoSeleccionado.observaciones}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={cerrarDialogo}>
                  Cerrar
                </Button>
                {(proyectoSeleccionado.estado === 'borrador' || proyectoSeleccionado.estado === 'corregir') && (
                  <Button onClick={() => {
                    setModoDialogo('editar');
                  }}>
                    Editar
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <FormularioProyecto
              proyecto={modoDialogo === 'editar' ? proyectoSeleccionado || undefined : undefined}
              onSubmit={modoDialogo === 'editar' ? handleActualizarProyecto : handleCrearProyecto}
              onCancel={cerrarDialogo}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={className}>{children}</label>
);
