import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { proyectoService } from "@/services/proyectoService"
import { Proyecto, EstadisticasProyecto, Usuario } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "./components/app-sidebar"
import { SectionCards } from "./components/section-cards"
import { SiteHeader } from "./components/site-header"
import { ProyectosTable } from "./components/proyectos-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useNavigate } from "react-router-dom"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

// Type assertions para evitar problemas de TypeScript
const SiteHeaderComponent = SiteHeader as React.ComponentType<{ onRefreshData?: () => void }>
const SectionCardsComponent = SectionCards as React.ComponentType<{ estadisticas: EstadisticasProyecto | null; loading: boolean; usuario: Usuario | null }>

export function Dashboard() {
  const { usuario, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasProyecto | null>(null)
  const [loadingProyectos, setLoadingProyectos] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  type AccionEstado = "aprobado" | "rechazado" | "en_revision"

  const [dialogEstado, setDialogEstado] = useState<{
    abierto: boolean
    proyecto: Proyecto | null
    estado: AccionEstado | null
  }>({
    abierto: false,
    proyecto: null,
    estado: null,
  })
  const [dialogRevision, setDialogRevision] = useState<{
    abierto: boolean
    proyecto: Proyecto | null
    tieneObservaciones: boolean
  }>({
    abierto: false,
    proyecto: null,
    tieneObservaciones: false,
  })
  const [motivoAccion, setMotivoAccion] = useState("")
  const [observacionRevision, setObservacionRevision] = useState("")
  const [errorMotivo, setErrorMotivo] = useState("")
  const [errorObservacion, setErrorObservacion] = useState("")
  const [procesandoEstado, setProcesandoEstado] = useState(false)
  const [procesandoRevision, setProcesandoRevision] = useState(false)

  useEffect(() => {
    if (usuario) {
      cargarDatos()
    }
  }, [usuario, refreshTrigger])

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

  const ejecutarCambioEstado = async (
    proyectoId: number,
    estado: AccionEstado,
    observaciones?: string
  ) => {
    try {
      setProcesandoEstado(true)
      await proyectoService.cambiarEstado(proyectoId, estado, observaciones)
      toast.success(`Proyecto actualizado: ${estado.replace("_", " ")}`)
      await cargarDatos()
    } catch (error: any) {
      toast.error("Error al actualizar estado", {
        description: error.response?.data?.message || "No se pudo actualizar el estado",
      })
    } finally {
      setProcesandoEstado(false)
    }
  }

  const getConfigEstado = (estado: AccionEstado) => {
    switch (estado) {
      case "aprobado":
        return {
          titulo: "Aprobar proyecto",
          descripcion: "Confirma si deseas aprobar este proyecto. El estudiante será notificado.",
          requiereMotivo: false,
          placeholder: "",
          confirmLabel: "Aprobar",
        }
      case "en_revision":
        return {
          titulo: "Enviar a revisión",
          descripcion: "Describe brevemente por qué colocas el proyecto en revisión para que el estudiante pueda trabajar en ello.",
          requiereMotivo: true,
          placeholder: "Explica qué debe revisar el estudiante...",
          confirmLabel: "Enviar a revisión",
        }
      case "rechazado":
        return {
          titulo: "Rechazar proyecto",
          descripcion: "Indica el motivo del rechazo para que el estudiante pueda corregirlo.",
          requiereMotivo: true,
          placeholder: "Escribe el motivo del rechazo...",
          confirmLabel: "Rechazar",
        }
    }
  }

  const handleCambiarEstado = (
    proyecto: Proyecto,
    estado: AccionEstado
  ) => {
    if (!proyecto.id) return

    setDialogEstado({
      abierto: true,
      proyecto,
      estado,
    })
    setMotivoAccion("")
    setErrorMotivo("")
  }

  const cerrarDialogoEstado = () => {
    setDialogEstado({
      abierto: false,
      proyecto: null,
      estado: null,
    })
    setMotivoAccion("")
    setErrorMotivo("")
  }

  const confirmarCambioEstado = async () => {
    if (!dialogEstado.proyecto?.id || !dialogEstado.estado) return

    const { requiereMotivo } = getConfigEstado(dialogEstado.estado)
    if (requiereMotivo && !motivoAccion.trim()) {
      setErrorMotivo("Por favor ingresa un motivo.")
      return
    }

    setErrorMotivo("")
    await ejecutarCambioEstado(dialogEstado.proyecto.id, dialogEstado.estado, motivoAccion.trim() || undefined)
    cerrarDialogoEstado()
  }

  const handleVerProyecto = (proyecto: Proyecto) => {
    if (proyecto.id) {
      navigate(`/proyectos/${proyecto.id}`)
    }
  }

  const handleAgregarRevision = async (proyecto: Proyecto) => {
    if (!proyecto.id) return
    
    try {
      // Verificar si ya hay observaciones
      const observaciones = await proyectoService.obtenerObservaciones(proyecto.id)
      setDialogRevision({
        abierto: true,
        proyecto,
        tieneObservaciones: observaciones.length > 0
      })
      setObservacionRevision("")
      setErrorObservacion("")
    } catch (error: any) {
      toast.error('Error al verificar observaciones', {
        description: error.response?.data?.message || 'No se pudieron cargar las observaciones'
      })
    }
  }

  const cerrarDialogoRevision = () => {
    setDialogRevision({
      abierto: false,
      proyecto: null,
      tieneObservaciones: false
    })
    setObservacionRevision("")
    setErrorObservacion("")
  }

  const confirmarAgregarRevision = async () => {
    if (!dialogRevision.proyecto?.id) return

    if (!observacionRevision.trim()) {
      setErrorObservacion("La observación es requerida")
      return
    }

    try {
      setProcesandoRevision(true)
      setErrorObservacion("")
      
      // Si el proyecto está en 'enviado', cambiar a 'corregir', si no, solo agregar observación
      if (dialogRevision.proyecto.estado === 'enviado') {
        await proyectoService.cambiarEstado(dialogRevision.proyecto.id, 'corregir', observacionRevision.trim())
      } else {
        await proyectoService.agregarObservacion(dialogRevision.proyecto.id, observacionRevision.trim())
      }
      
      toast.success('Observación agregada', {
        description: 'La observación ha sido agregada al proyecto'
      })
      cerrarDialogoRevision()
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al agregar observación', {
        description: error.response?.data?.message || 'No se pudo agregar la observación'
      })
    } finally {
      setProcesandoRevision(false)
    }
  }

  const refrescarDatos = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const configEstado = dialogEstado.estado ? getConfigEstado(dialogEstado.estado) : null

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
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeaderComponent onRefreshData={refrescarDatos} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Welcome Section */}
              <div className="px-4 lg:px-6 animate-slide-in">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Bienvenido, {usuario?.nombre}
                  </h1>
                  <p
                    className="mt-2 text-muted-foreground animate-slide-in"
                    style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
                  >
                    Gestiona los proyectos asignados como tutor
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div
                className="px-4 lg:px-6 animate-fade-in"
                style={{ animationDelay: "0.2s", opacity: 0, animationFillMode: "forwards" }}
              >
                <SectionCardsComponent estadisticas={estadisticas} loading={loadingProyectos} usuario={usuario} />
              </div>

              {/* Projects Section */}
              <div
                className="px-4 lg:px-6 animate-fade-in"
                style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Proyectos Asignados</h2>
                </div>

                <Card className="animate-scale-in" style={{ animationDelay: "0.4s", opacity: 0, animationFillMode: "forwards" }}>
                  <CardContent className="p-0 relative overflow-visible">
                    <ProyectosTable
                      proyectos={proyectos}
                      loading={loadingProyectos}
                      onVer={handleVerProyecto}
                      onCambiarEstado={handleCambiarEstado}
                      onAgregarRevision={handleAgregarRevision}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <AlertDialog open={dialogEstado.abierto} onOpenChange={(open) => (!open ? cerrarDialogoEstado() : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{configEstado?.titulo ?? ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {configEstado?.descripcion ?? ""}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {configEstado?.requiereMotivo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Motivo</label>
              <Textarea
                value={motivoAccion}
                onChange={(e) => {
                  setMotivoAccion(e.target.value)
                  if (e.target.value.trim()) {
                    setErrorMotivo("")
                  }
                }}
                placeholder={configEstado.placeholder}
                rows={4}
              />
              {errorMotivo && <p className="text-sm text-destructive">{errorMotivo}</p>}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cerrarDialogoEstado} disabled={procesandoEstado}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCambioEstado} disabled={procesandoEstado}>
              {procesandoEstado ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                configEstado?.confirmLabel ?? "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para agregar revisión/observación */}
      <AlertDialog open={dialogRevision.abierto} onOpenChange={(open) => (!open ? cerrarDialogoRevision() : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogRevision.tieneObservaciones ? 'Dar otra revisión' : 'Revisión'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogRevision.tieneObservaciones 
                ? 'Agrega una nueva observación para que el estudiante pueda corregir el proyecto.'
                : 'Agrega observaciones sobre el proyecto para que el estudiante pueda corregirlo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Observación</label>
            <Textarea
              value={observacionRevision}
              onChange={(e) => {
                setObservacionRevision(e.target.value)
                if (e.target.value.trim()) {
                  setErrorObservacion("")
                }
              }}
              placeholder="Escribe las observaciones sobre el proyecto..."
              rows={4}
            />
            {errorObservacion && <p className="text-sm text-destructive">{errorObservacion}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cerrarDialogoRevision} disabled={procesandoRevision}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmarAgregarRevision} disabled={procesandoRevision}>
              {procesandoRevision ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Agregar Observación'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
