import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { proyectoService } from "@/services/proyectoService"
import { Proyecto, EstadisticasProyecto } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { AppSidebar } from "./components/app-sidebar"
import { SectionCards } from "./components/section-cards"
import { SiteHeader } from "./components/site-header"
import { ProyectosTable } from "./components/proyectos-table"
import { ProyectoForm } from "./components/proyecto-form"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ChatAssistant } from "@/components/ChatAssistant/ChatAssistant"
import introJs from "intro.js"
import "intro.js/introjs.css"
import "./intro-custom.css"

export function Dashboard() {
  const { usuario, loading: authLoading } = useAuth()
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasProyecto | null>(null)
  const [loadingProyectos, setLoadingProyectos] = useState(true)
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [modoDrawer, setModoDrawer] = useState<'crear' | 'editar' | 'ver'>('crear')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const tourIniciado = useRef(false)

  const usuarioId = usuario?.id
  
  useEffect(() => {
    if (usuarioId && !authLoading) {
      cargarDatos()
    }
  }, [usuarioId, refreshTrigger, authLoading]) // Solo recargar si cambia el ID del usuario, no el objeto completo

  // Iniciar tour automáticamente la primera vez
  useEffect(() => {
    if (!authLoading && !loadingProyectos && usuarioId && !tourIniciado.current) {
      const haVistoTour = localStorage.getItem('dashboard-tour-completado')
      
      if (!haVistoTour) {
        // Esperar un poco para que los elementos se rendericen
        setTimeout(() => {
          iniciarTourAutomatico()
        }, 1000)
      }
    }
  }, [authLoading, loadingProyectos, usuarioId])

  const cargarDatos = async () => {
    try {
      setLoadingProyectos(true)
      const [proyectosData, estadisticasData] = await Promise.all([
        proyectoService.obtenerProyectos(),
        proyectoService.obtenerEstadisticas()
      ])
      setProyectos(proyectosData)
      setEstadisticas(estadisticasData)
    } catch (error: any) {
      toast.error('Error al cargar datos', {
        description: error.response?.data?.message || 'No se pudieron cargar los datos'
      })
    } finally {
      setLoadingProyectos(false)
    }
  }

  const handleCrearProyecto = async (proyecto: Partial<Proyecto>) => {
    try {
      const proyectoParaGuardar: Partial<Proyecto> = {
        titulo: proyecto.titulo,
        descripcion: proyecto.descripcion,
        planteamiento: proyecto.planteamiento,
        solucion_problema: proyecto.solucion_problema,
      }
      await proyectoService.crearProyecto(proyectoParaGuardar)
    } catch (error) {
      throw error
    }
  }

  const handleActualizarProyecto = async (proyecto: Partial<Proyecto>) => {
    if (!proyectoSeleccionado?.id) return
    
    try {
      const proyectoParaGuardar: Partial<Proyecto> = {
        titulo: proyecto.titulo,
        planteamiento: proyecto.planteamiento,
        solucion_problema: proyecto.solucion_problema,
        // Priorizar siempre la descripción que viene del formulario;
        // si no viene, usar la que ya tenía el proyecto o un fallback
        descripcion: proyecto.descripcion
          || proyectoSeleccionado.descripcion
          || proyecto.planteamiento
          || proyectoSeleccionado.planteamiento
          || 'Sin descripción'
      }
      await proyectoService.actualizarProyecto(proyectoSeleccionado.id, proyectoParaGuardar)
    } catch (error) {
      throw error
    }
  }

  const handleEnviarProyecto = async (proyecto: Proyecto) => {
    if (!proyecto.id) return

    try {
      await proyectoService.cambiarEstado(proyecto.id, 'enviado')
      toast.success('Proyecto enviado', {
        description: 'El proyecto ha sido enviado para revisión'
      })
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al enviar proyecto', {
        description: error.response?.data?.message || 'No se pudo enviar el proyecto'
      })
    }
  }

  const handleEliminarProyecto = async (proyecto: Proyecto) => {
    if (!proyecto.id) return

    try {
      await proyectoService.eliminarProyecto(proyecto.id)
      toast.success('Proyecto eliminado', {
        description: 'El proyecto ha sido eliminado correctamente'
      })
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al eliminar proyecto', {
        description: error.response?.data?.message || 'No se pudo eliminar el proyecto'
      })
    }
  }

  const abrirDrawerCrear = () => {
    setModoDrawer('crear')
    setProyectoSeleccionado(null)
    setDrawerAbierto(true)
  }

  const abrirDrawerEditar = (proyecto: Proyecto) => {
    setModoDrawer('editar')
    setProyectoSeleccionado(proyecto)
    setDrawerAbierto(true)
  }

  const abrirDrawerVer = (proyecto: Proyecto) => {
    setModoDrawer('ver')
    setProyectoSeleccionado(proyecto)
    setDrawerAbierto(true)
  }


  const refrescarDatos = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const iniciarTourAutomatico = () => {
    if (tourIniciado.current) return
    
    const intro = introJs()
    
    intro.setOptions({
      steps: [
        {
          intro: "¡Bienvenido al Dashboard! Este tour te mostrará las principales funcionalidades del sistema."
        },
        {
          element: document.querySelector('[data-tour="welcome-section"]'),
          intro: "Aquí encontrarás tu saludo personalizado y una breve descripción del sistema."
        },
        {
          element: document.querySelector('[data-tour="stats-cards"]'),
          intro: "Estas tarjetas muestran estadísticas importantes sobre tus proyectos: total, aprobados, en revisión y más."
        },
        {
          element: document.querySelector('[data-tour="sidebar"]'),
          intro: "El menú lateral te permite navegar rápidamente. Aquí verás tus proyectos y accesos directos a cada uno."
        },
        {
          element: document.querySelector('[data-tour="notificaciones"]'),
          intro: "El icono de campana muestra tus notificaciones. Recibirás alertas cuando tus proyectos sean revisados, aprobados o rechazados."
        },
        {
          element: document.querySelector('[data-tour="theme-toggle"]'),
          intro: "Este botón te permite cambiar entre modo oscuro y claro. Elige el que prefieras para trabajar más cómodamente."
        },
        {
          element: document.querySelector('[data-tour="proyectos-section"]'),
          intro: "En esta sección puedes ver todos tus proyectos en una tabla. Puedes ver detalles, editar o eliminar proyectos."
        },
        {
          element: document.querySelector('[data-tour="nuevo-proyecto-btn"]'),
          intro: "Haz clic aquí para crear un nuevo proyecto. Podrás agregar toda la información necesaria."
        },
        {
          intro: "¡Listo! Ya conoces lo básico del Dashboard. Puedes acceder a la Documentación desde el menú lateral para más información."
        }
      ],
      showProgress: false,
      showBullets: false,
      showButtons: true,
      showStepNumbers: false,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      disableInteraction: false,
      nextLabel: '→',
      prevLabel: '←',
      skipLabel: '✕',
      doneLabel: '✓'
    })

    intro.onexit(() => {
      localStorage.setItem('dashboard-tour-completado', 'true')
    })

    intro.oncomplete(() => {
      localStorage.setItem('dashboard-tour-completado', 'true')
    })

    intro.start()
    tourIniciado.current = true
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-1/3 mx-auto" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <div data-tour="sidebar">
        <AppSidebar variant="inset" proyectos={proyectos} />
      </div>
      <SidebarInset>
        <SiteHeader onRefreshData={refrescarDatos} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Welcome Section */}
              <div className="px-4 lg:px-6 animate-slide-in" data-tour="welcome-section">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Bienvenido, {usuario?.nombre && usuario?.apellido 
                      ? `${usuario.nombre} ${usuario.apellido}`.trim()
                      : usuario?.nombre || usuario?.apellido || 'Usuario'}
                  </h1>
                  <p className="mt-2 text-muted-foreground animate-slide-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                    Gestiona tus proyectos académicos
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="px-4 lg:px-6 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }} data-tour="stats-cards">
                <SectionCards estadisticas={estadisticas} loading={loadingProyectos} usuario={usuario} />
              </div>

              {/* Projects Section */}
              <div className="px-4 lg:px-6 animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }} data-tour="proyectos-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Proyectos</h2>
                  <Button onClick={abrirDrawerCrear} className="gap-2" data-tour="nuevo-proyecto-btn">
                    <Plus className="h-4 w-4" />
                    Nuevo Proyecto
                  </Button>
                </div>

                <Card className="animate-scale-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
                  <CardContent className="p-0 relative overflow-visible">
                    <ProyectosTable
                      proyectos={proyectos}
                      loading={loadingProyectos}
                      onVer={abrirDrawerVer}
                      onEditar={abrirDrawerEditar}
                      onEnviar={handleEnviarProyecto}
                      onEliminar={handleEliminarProyecto}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Drawer para crear/editar/ver proyecto */}
      <ProyectoForm
        proyecto={modoDrawer === 'editar' || modoDrawer === 'ver' ? proyectoSeleccionado || undefined : undefined}
        open={drawerAbierto}
        onOpenChange={(newOpen) => {
          // Solo actualizar el estado si realmente cambió
          if (newOpen !== drawerAbierto) {
            setDrawerAbierto(newOpen)
            if (!newOpen) {
              // Cargar datos y limpiar estado después de que el modal se cierre completamente
              // Usar un delay más largo para asegurar que la animación de cierre termine
              setTimeout(() => {
                cargarDatos()
                setProyectoSeleccionado(null)
              }, 600)
            }
          }
        }}
        onSubmit={modoDrawer === 'editar' ? handleActualizarProyecto : handleCrearProyecto}
        mode={modoDrawer}
      />
      
      {/* Asistente de Chat con IA */}
      <ChatAssistant proyectoId={proyectoSeleccionado?.id} />
    </SidebarProvider>
  )
}