"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { proyectoService } from "@/services/proyectoService"
import { archivoService, ArchivoProyecto } from "@/services/archivoService"
import { Proyecto } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Trash2, 
  File,
  FileText,
  AlertCircle,
  CheckCircle2,
  Target,
  Lightbulb,
  BookOpen,
  Calendar,
  User,
  DollarSign,
  Clock,
  FileCheck,
  Loader2,
  Check,
  XCircle,
  Eye,
  MessageSquare,
  Pencil,
  Save,
  X
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ChatProyecto } from "@/components/ChatProyecto"

type CategoriaArchivo = 'diagnostico' | 'antecedentes' | 'objetivos' | 'otro'

const categorias: { 
  value: CategoriaArchivo
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
}[] = [
  { 
    value: 'diagnostico', 
    label: 'Diagnóstico', 
    icon: FileCheck, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
  },
  { 
    value: 'antecedentes', 
    label: 'Antecedentes', 
    icon: BookOpen, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20'
  },
  { 
    value: 'objetivos', 
    label: 'Objetivos', 
    icon: Target, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
  },
]

export function DetallesProyecto() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [archivos, setArchivos] = useState<ArchivoProyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [subiendoArchivo, setSubiendoArchivo] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState<string | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [observacionesEstado, setObservacionesEstado] = useState("")
  const [mostrarDialogoEstado, setMostrarDialogoEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState<any[]>([])
  const [chatAbierto, setChatAbierto] = useState(false)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  
  // Estados para edición
  const [editandoTitulo, setEditandoTitulo] = useState(false)
  const [editandoPlanteamiento, setEditandoPlanteamiento] = useState(false)
  const [editandoSolucion, setEditandoSolucion] = useState(false)
  const [tituloEditado, setTituloEditado] = useState("")
  const [planteamientoEditado, setPlanteamientoEditado] = useState("")
  const [solucionEditado, setSolucionEditado] = useState("")
  const [guardando, setGuardando] = useState(false)
  
  const esEstudiante = usuario?.rol === 'estudiante' && proyecto?.estudiante_id === usuario?.id

  useEffect(() => {
    if (id) {
      cargarDatos()
    }
  }, [id])

  const cargarDatos = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const [proyectoData, archivosData, observacionesData] = await Promise.all([
        proyectoService.obtenerProyecto(parseInt(id)),
        archivoService.obtenerArchivosPorProyecto(parseInt(id)),
        proyectoService.obtenerObservaciones(parseInt(id)).catch(() => [])
      ])
      setProyecto(proyectoData)
      setArchivos(archivosData)
      setObservaciones(observacionesData)
      // Resetear estados de edición
      setEditandoTitulo(false)
      setEditandoPlanteamiento(false)
      setEditandoSolucion(false)
    } catch (error: any) {
      toast.error('Error al cargar el proyecto', {
        description: error.response?.data?.message || 'No se pudo cargar la información del proyecto'
      })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const validarArchivo = (file: File): boolean => {
    const tiposPermitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!tiposPermitidos.includes(file.type)) {
      toast.error('Tipo de archivo no permitido', {
        description: 'Solo se permiten archivos PDF o Word (.doc, .docx)'
      })
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Archivo demasiado grande', {
        description: 'El archivo no debe exceder 10MB'
      })
      return false
    }

    return true
  }

  const handleSubirArchivo = async (
    file: File,
    categoria: CategoriaArchivo
  ) => {
    if (!id || !validarArchivo(file)) return

    try {
      setSubiendoArchivo(categoria)
      await archivoService.subirArchivo(
        parseInt(id),
        file,
        `Archivo de ${categorias.find(c => c.value === categoria)?.label}`,
        categoria
      )
      toast.success('Archivo subido exitosamente', {
        description: `"${file.name}" ha sido subido correctamente`
      })
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al subir archivo', {
        description: error.response?.data?.message || 'No se pudo subir el archivo'
      })
    } finally {
      setSubiendoArchivo(null)
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>, categoria: CategoriaArchivo) => {
    const file = event.target.files?.[0]
    if (file) {
      handleSubirArchivo(file, categoria)
      event.target.value = ''
    }
  }

  const handleDrag = (e: React.DragEvent, categoria: CategoriaArchivo) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(categoria)
    } else if (e.type === "dragleave") {
      setDragActive(null)
    }
  }

  const handleDrop = (e: React.DragEvent, categoria: CategoriaArchivo) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(null)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSubirArchivo(e.dataTransfer.files[0], categoria)
    }
  }

  const handleDescargarArchivo = async (archivo: ArchivoProyecto) => {
    try {
      const blob = await archivoService.descargarArchivo(archivo.id!)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = archivo.nombre_original
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Archivo descargado', {
        description: `"${archivo.nombre_original}" descargado correctamente`
      })
    } catch (error: any) {
      toast.error('Error al descargar archivo', {
        description: error.response?.data?.message || 'No se pudo descargar el archivo'
      })
    }
  }

  const handleEliminarArchivo = async (archivo: ArchivoProyecto) => {
    try {
      await archivoService.eliminarArchivo(archivo.id!)
      toast.success('Archivo eliminado', {
        description: `"${archivo.nombre_original}" ha sido eliminado`
      })
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al eliminar archivo', {
        description: error.response?.data?.message || 'No se pudo eliminar el archivo'
      })
    }
  }

  const iniciarEdicionTitulo = () => {
    if (proyecto) {
      setTituloEditado(proyecto.titulo)
      setEditandoTitulo(true)
    }
  }

  const cancelarEdicionTitulo = () => {
    setEditandoTitulo(false)
    setTituloEditado("")
  }

  const guardarTitulo = async () => {
    if (!proyecto?.id || !tituloEditado.trim()) {
      toast.error('El título no puede estar vacío')
      return
    }

    try {
      setGuardando(true)
      await proyectoService.actualizarProyecto(proyecto.id, { titulo: tituloEditado.trim() })
      toast.success('Título actualizado')
      setEditandoTitulo(false)
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al actualizar título', {
        description: error.response?.data?.message || 'No se pudo actualizar el título'
      })
    } finally {
      setGuardando(false)
    }
  }

  const iniciarEdicionPlanteamiento = () => {
    if (proyecto) {
      setPlanteamientoEditado(proyecto.planteamiento || "")
      setEditandoPlanteamiento(true)
    }
  }

  const cancelarEdicionPlanteamiento = () => {
    setEditandoPlanteamiento(false)
    setPlanteamientoEditado("")
  }

  const guardarPlanteamiento = async () => {
    if (!proyecto?.id) return

    try {
      setGuardando(true)
      await proyectoService.actualizarProyecto(proyecto.id, { planteamiento: planteamientoEditado.trim() || undefined })
      toast.success('Planteamiento actualizado')
      setEditandoPlanteamiento(false)
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al actualizar planteamiento', {
        description: error.response?.data?.message || 'No se pudo actualizar el planteamiento'
      })
    } finally {
      setGuardando(false)
    }
  }

  const iniciarEdicionSolucion = () => {
    if (proyecto) {
      setSolucionEditado(proyecto.solucion_problema || "")
      setEditandoSolucion(true)
    }
  }

  const cancelarEdicionSolucion = () => {
    setEditandoSolucion(false)
    setSolucionEditado("")
  }

  const guardarSolucion = async () => {
    if (!proyecto?.id) return

    try {
      setGuardando(true)
      await proyectoService.actualizarProyecto(proyecto.id, { solucion_problema: solucionEditado.trim() || undefined })
      toast.success('Solución actualizada')
      setEditandoSolucion(false)
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al actualizar solución', {
        description: error.response?.data?.message || 'No se pudo actualizar la solución'
      })
    } finally {
      setGuardando(false)
    }
  }

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatearFechaHora = (fecha?: string) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatearTamaño = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      borrador: { variant: 'secondary', label: 'Borrador' },
      enviado: { variant: 'default', label: 'Enviado' },
      en_revision: { variant: 'outline', label: 'En Revisión' },
      aprobado: { variant: 'default', label: 'Aprobado' },
      rechazado: { variant: 'destructive', label: 'Rechazado' },
      corregir: { variant: 'outline', label: 'Por Corregir' }
    }
    const config = estados[estado] || estados.borrador
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
  }

  const archivosPorCategoria = (categoria: CategoriaArchivo) => {
    return archivos.filter(a => a.categoria === categoria)
  }

  const esTutor = usuario?.rol === 'tutor'
  const esTutorAsignado = esTutor && proyecto?.tutor_id === usuario?.id

  const handleCambiarEstado = async (estado: string) => {
    if (!proyecto?.id) return
    setNuevoEstado(estado)
    setMostrarDialogoEstado(true)
  }

  const confirmarCambioEstado = async () => {
    if (!proyecto?.id || !nuevoEstado) return

    try {
      setCambiandoEstado(true)
      
      // Si es tutor dando "otra revisión" y el proyecto ya está en 'corregir', solo agregar observación
      if (esTutor && nuevoEstado === 'corregir' && proyecto.estado === 'corregir' && observacionesEstado.trim()) {
        await proyectoService.agregarObservacion(proyecto.id, observacionesEstado.trim())
        toast.success('Observación agregada', {
          description: 'La observación ha sido agregada al proyecto'
        })
      } else {
        await proyectoService.cambiarEstado(proyecto.id, nuevoEstado, observacionesEstado || undefined)
        toast.success('Estado actualizado', {
          description: `El proyecto ha sido ${nuevoEstado === 'aprobado' ? 'aprobado' : nuevoEstado === 'rechazado' ? 'rechazado' : 'puesto en revisión'}`
        })
      }
      
      setMostrarDialogoEstado(false)
      setObservacionesEstado("")
      setNuevoEstado(null)
      await cargarDatos()
    } catch (error: any) {
      toast.error('Error al cambiar estado', {
        description: error.response?.data?.message || 'No se pudo cambiar el estado del proyecto'
      })
    } finally {
      setCambiandoEstado(false)
    }
  }

  const renderCampo = (label: string, value: string | number | undefined, icon?: React.ElementType) => {
    if (!value && value !== 0) return null
    const Icon = icon
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </div>
        <p className="text-sm leading-relaxed text-foreground pl-6">{String(value)}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">Proyecto no encontrado</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  El proyecto que buscas no existe o no tienes permiso para verlo.
                </p>
              </div>
              <Button onClick={() => navigate('/')} variant="outline">
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 animate-slide-in">
          <div className="flex items-start gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                {editandoTitulo && esEstudiante ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={tituloEditado}
                      onChange={(e) => setTituloEditado(e.target.value)}
                      className="text-3xl font-bold"
                      disabled={guardando}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={guardarTitulo}
                      disabled={guardando || !tituloEditado.trim()}
                    >
                      {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelarEdicionTitulo}
                      disabled={guardando}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <h1 className="text-3xl font-bold tracking-tight truncate">{proyecto.titulo}</h1>
                    {esEstudiante && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={iniciarEdicionTitulo}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                {getEstadoBadge(proyecto.estado)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Creado el {formatearFecha(proyecto.fecha_creacion)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna Principal - Información del Proyecto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Planteamiento y Solución */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Planteamiento del Problema
                  </div>
                  {esEstudiante && !editandoPlanteamiento && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={iniciarEdicionPlanteamiento}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editandoPlanteamiento && esEstudiante ? (
                  <div className="space-y-3">
                    <Textarea
                      value={planteamientoEditado}
                      onChange={(e) => setPlanteamientoEditado(e.target.value)}
                      placeholder="Describe el planteamiento del problema..."
                      rows={6}
                      disabled={guardando}
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelarEdicionPlanteamiento}
                        disabled={guardando}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={guardarPlanteamiento}
                        disabled={guardando}
                      >
                        {guardando ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {proyecto.planteamiento || 'No especificado'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Solución Propuesta
                  </div>
                  {esEstudiante && !editandoSolucion && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={iniciarEdicionSolucion}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editandoSolucion && esEstudiante ? (
                  <div className="space-y-3">
                    <Textarea
                      value={solucionEditado}
                      onChange={(e) => setSolucionEditado(e.target.value)}
                      placeholder="Describe la solución propuesta..."
                      rows={6}
                      disabled={guardando}
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelarEdicionSolucion}
                        disabled={guardando}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={guardarSolucion}
                        disabled={guardando}
                      >
                        {guardando ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {proyecto.solucion_problema || 'No especificado'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Objetivos */}
            {(proyecto.objetivo_general || proyecto.objetivos_especificos) && (
              <Card className="animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objetivos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderCampo('Objetivo General', proyecto.objetivo_general)}
                  {renderCampo('Objetivos Específicos', proyecto.objetivos_especificos)}
                </CardContent>
              </Card>
            )}

            {/* Metodología y Justificación */}
            {(proyecto.metodologia || proyecto.justificacion) && (
              <Card className="animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Metodología y Justificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderCampo('Metodología', proyecto.metodologia)}
                  {renderCampo('Justificación', proyecto.justificacion)}
                </CardContent>
              </Card>
            )}

            {/* Resultados Esperados */}
            {proyecto.resultados_esperados && (
              <Card className="animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Resultados Esperados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {proyecto.resultados_esperados}
                  </p>
                </CardContent>
              </Card>
            )}


            {/* Sección de Archivos */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-semibold">Documentos del Proyecto</h2>
              {categorias.map((categoria, index) => {
                const archivosCategoria = archivosPorCategoria(categoria.value)
                const Icon = categoria.icon
                const isDragActive = dragActive === categoria.value
                const isUploading = subiendoArchivo === categoria.value
                
                return (
                  <Card 
                    key={categoria.value} 
                    className="overflow-hidden animate-fade-in" 
                    style={{ animationDelay: `${0.7 + index * 0.1}s`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center",
                            categoria.bgColor
                          )}>
                            <Icon className={cn("h-5 w-5", categoria.color)} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{categoria.label}</CardTitle>
                            <CardDescription className="text-xs">
                              {archivosCategoria.length} {archivosCategoria.length === 1 ? 'archivo' : 'archivos'}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Zona de subida */}
                      <div
                        className={cn(
                          "relative border-2 border-dashed rounded-lg p-6 transition-all",
                          isDragActive 
                            ? "border-primary bg-primary/5" 
                            : "border-muted-foreground/25 hover:border-muted-foreground/50",
                          isUploading && "opacity-50 pointer-events-none"
                        )}
                        onDragEnter={(e) => handleDrag(e, categoria.value)}
                        onDragLeave={(e) => handleDrag(e, categoria.value)}
                        onDragOver={(e) => handleDrag(e, categoria.value)}
                        onDrop={(e) => handleDrop(e, categoria.value)}
                      >
                        <input
                          ref={(el) => fileInputRefs.current[categoria.value] = el}
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          onChange={(e) => handleFileInput(e, categoria.value)}
                          disabled={isUploading}
                        />
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          {isUploading ? (
                            <>
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Subiendo archivo...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  Arrastra un archivo aquí o{" "}
                                  <button
                                    type="button"
                                    onClick={() => fileInputRefs.current[categoria.value]?.click()}
                                    className="text-primary hover:underline"
                                  >
                                    selecciona uno
                                  </button>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  PDF o Word (máx. 10MB)
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lista de archivos */}
                      {archivosCategoria.length > 0 && (
                        <div className="space-y-2">
                          {archivosCategoria.map((archivo) => (
                            <div
                              key={archivo.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <File className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{archivo.nombre_original}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-muted-foreground">
                                      {formatearTamaño(archivo.tamaño_bytes)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatearFechaHora(archivo.fecha_subida)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDescargarArchivo(archivo)}
                                  title="Descargar"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {/* Solo el estudiante puede eliminar archivos, no el tutor */}
                                {usuario?.rol === 'estudiante' && proyecto?.estudiante_id === usuario?.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esta acción no se puede deshacer. Se eliminará permanentemente el archivo
                                          <span className="font-semibold"> "{archivo.nombre_original}"</span>.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleEliminarArchivo(archivo)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Sidebar - Información Adicional y Chat */}
          <div className="space-y-6">
            {/* Acciones del Tutor */}
            {esTutor && proyecto.estado !== 'borrador' && (
              <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                <CardHeader>
                  <CardTitle className="text-base">Acciones del Tutor</CardTitle>
                  <CardDescription>Gestiona el estado del proyecto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {proyecto.estado === 'enviado' && esTutorAsignado && (
                    <Button
                      onClick={() => handleCambiarEstado('en_revision')}
                      className="w-full"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Poner en Revisión
                    </Button>
                  )}
                  {(proyecto.estado === 'en_revision' || proyecto.estado === 'rechazado') && esTutorAsignado && (
                    <>
                      <Button
                        onClick={() => handleCambiarEstado('aprobado')}
                        className="w-full"
                        variant="default"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprobar Proyecto
                      </Button>
                      <Button
                        onClick={() => handleCambiarEstado('corregir')}
                        className="w-full"
                        variant="outline"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Dar otra revisión
                      </Button>
                      <Button
                        onClick={() => handleCambiarEstado('rechazado')}
                        className="w-full"
                        variant="destructive"
                        disabled={proyecto.estado === 'rechazado'}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar Proyecto
                      </Button>
                    </>
                  )}
                  {proyecto.estado === 'corregir' && esTutorAsignado && (
                    <>
                      <Button
                        onClick={() => handleCambiarEstado('aprobado')}
                        className="w-full"
                        variant="default"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprobar Proyecto
                      </Button>
                      <Button
                        onClick={() => handleCambiarEstado('corregir')}
                        className="w-full"
                        variant="outline"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Dar otra revisión
                      </Button>
                      <Button
                        onClick={() => handleCambiarEstado('rechazado')}
                        className="w-full"
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar Proyecto
                      </Button>
                    </>
                  )}
                  {proyecto.estado === 'aprobado' && esTutorAsignado && (
                    <div className="text-center py-4 space-y-3">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-green-500" />
                      <div>
                        <p className="text-sm font-medium mb-1">Este proyecto ha sido aprobado</p>
                        <p className="text-xs text-muted-foreground">
                          El proyecto ha completado el proceso de revisión exitosamente.
                        </p>
                      </div>
                    </div>
                  )}
                  {!esTutorAsignado && esTutor && (
                    <div className="text-center py-4 space-y-3">
                      <AlertCircle className="h-8 w-8 mx-auto opacity-50" />
                      <div>
                        <p className="text-sm font-medium mb-1">No estás asignado como tutor</p>
                        <p className="text-xs text-muted-foreground">
                          Este proyecto no tiene un tutor asignado o no eres el tutor asignado.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Observaciones del Proyecto */}
            <Card className="animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="text-base">Observaciones</CardTitle>
                <CardDescription>Historial de observaciones del proyecto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {observaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay observaciones aún</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {observaciones.map((obs) => (
                      <div key={obs.id} className="p-3 rounded-lg border bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {obs.usuario_nombre} {obs.usuario_apellido}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatearFechaHora(obs.fecha_creacion)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{obs.observacion}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {obs.estado_proyecto === 'corregir' ? 'Por Corregir' : 
                           obs.estado_proyecto === 'rechazado' ? 'Rechazado' : 
                           obs.estado_proyecto}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
              <CardHeader>
                <CardTitle className="text-base">Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderCampo('Descripción', proyecto.descripcion)}
                {renderCampo('Versión', `v${proyecto.version}`, FileText)}
                {proyecto.presupuesto_estimado && renderCampo(
                  'Presupuesto Estimado', 
                  `$${proyecto.presupuesto_estimado.toLocaleString('es-ES')}`, 
                  DollarSign
                )}
                {proyecto.duracion_meses && renderCampo(
                  'Duración', 
                  `${proyecto.duracion_meses} ${proyecto.duracion_meses === 1 ? 'mes' : 'meses'}`, 
                  Clock
                )}
                {proyecto.tutor_nombre && renderCampo(
                  'Tutor Asignado', 
                  `${proyecto.tutor_nombre} ${proyecto.tutor_apellido}`, 
                  User
                )}
                {proyecto.estudiante_nombre && renderCampo(
                  'Estudiante', 
                  `${proyecto.estudiante_nombre} ${proyecto.estudiante_apellido}`, 
                  User
                )}
                {proyecto.fecha_revision && renderCampo(
                  'Fecha de Revisión', 
                  formatearFecha(proyecto.fecha_revision), 
                  Calendar
                )}
                {proyecto.fecha_aprobacion && renderCampo(
                  'Fecha de Aprobación', 
                  formatearFecha(proyecto.fecha_aprobacion), 
                  CheckCircle2
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Botón flotante de Chat */}
        {proyecto.id && (proyecto.tutor_id || esTutor) && (
          <Button
            onClick={() => setChatAbierto(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-transform animate-scale-in"
            style={{ animationDelay: '0.8s', opacity: 0, animationFillMode: 'forwards' }}
            size="lg"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}

        {/* Dialog del Chat */}
        {proyecto.id && (proyecto.tutor_id || esTutor) && (
          <Dialog open={chatAbierto} onOpenChange={setChatAbierto}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
              <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat del Proyecto
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatProyecto
                  proyectoId={proyecto.id}
                  tutorNombre={proyecto.tutor_nombre}
                  tutorApellido={proyecto.tutor_apellido}
                  estudianteNombre={proyecto.estudiante_nombre}
                  estudianteApellido={proyecto.estudiante_apellido}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Dialog para cambiar estado */}
      <Dialog open={mostrarDialogoEstado} onOpenChange={setMostrarDialogoEstado}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {nuevoEstado === 'aprobado' && 'Aprobar Proyecto'}
              {nuevoEstado === 'rechazado' && 'Rechazar Proyecto'}
              {nuevoEstado === 'en_revision' && 'Poner en Revisión'}
              {nuevoEstado === 'corregir' && (esTutor ? 'Dar otra revisión' : 'Solicitar Correcciones')}
            </DialogTitle>
            <DialogDescription>
              {nuevoEstado === 'aprobado' && '¿Estás seguro de que deseas aprobar este proyecto?'}
              {nuevoEstado === 'rechazado' && '¿Estás seguro de que deseas rechazar este proyecto?'}
              {nuevoEstado === 'en_revision' && '¿Deseas poner este proyecto en revisión?'}
              {nuevoEstado === 'corregir' && (esTutor 
                ? 'Agrega observaciones adicionales para que el estudiante pueda corregir el proyecto. El proyecto volverá a estado de revisión.'
                : '¿Deseas solicitar correcciones para este proyecto?')}
              {(nuevoEstado === 'rechazado' || nuevoEstado === 'corregir') && (esTutor && nuevoEstado === 'corregir' 
                ? '' 
                : ' Puedes agregar observaciones opcionales.')}
            </DialogDescription>
          </DialogHeader>
          {(nuevoEstado === 'rechazado' || nuevoEstado === 'corregir') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {esTutor && nuevoEstado === 'corregir' && proyecto?.estado === 'corregir' 
                  ? 'Nueva observación (requerido)' 
                  : 'Observaciones (opcional)'}
              </label>
              <Textarea
                value={observacionesEstado}
                onChange={(e) => setObservacionesEstado(e.target.value)}
                placeholder={esTutor && nuevoEstado === 'corregir' && proyecto?.estado === 'corregir'
                  ? "Agrega una nueva observación para el estudiante..."
                  : "Agrega observaciones sobre el proyecto..."}
                rows={4}
                required={esTutor && nuevoEstado === 'corregir' && proyecto?.estado === 'corregir'}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarDialogoEstado(false)
                setObservacionesEstado("")
                setNuevoEstado(null)
              }}
              disabled={cambiandoEstado}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarCambioEstado}
              disabled={cambiandoEstado}
              variant={nuevoEstado === 'rechazado' ? 'destructive' : 'default'}
            >
              {cambiandoEstado ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
