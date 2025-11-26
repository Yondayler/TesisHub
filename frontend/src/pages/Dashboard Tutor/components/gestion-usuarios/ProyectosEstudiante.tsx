"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { proyectoService } from "@/services/proyectoService"
import { Proyecto, Usuario } from "@/types"
import { IconArrowLeft, IconFileDescription, IconUser, IconCalendar, IconCoin, IconClock, IconCheck, IconX, IconEdit, IconClockHour4, IconFileText } from "@tabler/icons-react"
import { AsignarTutor } from "./AsignarTutor"

interface ProyectosEstudianteProps {
  estudiante: Usuario
  onVolver?: () => void
  onProyectoActualizado?: (proyecto: Proyecto) => void
}

const estadoConfig = {
  borrador: { 
    label: "Borrador", 
    color: "secondary" as const,
    bgGradient: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
    icon: IconFileText,
    iconColor: "text-gray-600 dark:text-gray-400"
  },
  enviado: { 
    label: "Enviado", 
    color: "default" as const,
    bgGradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    icon: IconFileDescription,
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  en_revision: { 
    label: "En Revisión", 
    color: "outline" as const,
    bgGradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
    icon: IconClockHour4,
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  aprobado: { 
    label: "Aprobado", 
    color: "default" as const,
    variant: "success" as any,
    bgGradient: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
    icon: IconCheck,
    iconColor: "text-green-600 dark:text-green-400"
  },
  rechazado: { 
    label: "Rechazado", 
    color: "destructive" as const,
    bgGradient: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20",
    icon: IconX,
    iconColor: "text-red-600 dark:text-red-400"
  },
  corregir: { 
    label: "Corregir", 
    color: "outline" as const,
    variant: "warning" as any,
    bgGradient: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
    icon: IconEdit,
    iconColor: "text-yellow-600 dark:text-yellow-400"
  },
}

export function ProyectosEstudiante({ estudiante, onVolver, onProyectoActualizado }: ProyectosEstudianteProps) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (estudiante.id) {
      cargarProyectos()
    }
  }, [estudiante.id])

  const cargarProyectos = async () => {
    try {
      setIsLoading(true)
      const data = await proyectoService.obtenerProyectosPorEstudiante(estudiante.id!)
      setProyectos(data)
    } catch (error: any) {
      console.error("Error al cargar proyectos:", error)
      toast.error("Error al cargar los proyectos del estudiante")
    } finally {
      setIsLoading(false)
    }
  }

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "N/A"
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatMoneda = (monto?: number) => {
    if (!monto) return "No especificado"
    return new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "VES",
      minimumFractionDigits: 2
    }).format(monto)
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Proyectos de {estudiante.nombre} {estudiante.apellido}</CardTitle>
          <CardDescription>
            Cargando proyectos...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onVolver}
          className="flex items-center gap-2"
        >
          <IconArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Proyectos de {estudiante.nombre} {estudiante.apellido}</h2>
          <p className="text-muted-foreground">{estudiante.email}</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center">{proyectos.length}</div>
            <div className="text-sm text-muted-foreground text-center">Total Proyectos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-green-600">
              {proyectos.filter(p => p.estado === 'aprobado').length}
            </div>
            <div className="text-sm text-muted-foreground text-center">Aprobados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-blue-600">
              {proyectos.filter(p => p.estado === 'en_revision').length}
            </div>
            <div className="text-sm text-muted-foreground text-center">En Revisión</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-red-600">
              {proyectos.filter(p => p.estado === 'rechazado').length}
            </div>
            <div className="text-sm text-muted-foreground text-center">Rechazados</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Proyectos */}
      {proyectos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <IconFileDescription className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground">
              Este estudiante aún no ha creado ningún proyecto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.map((proyecto, index) => {
            const estado = estadoConfig[proyecto.estado]
            const EstadoIcon = estado.icon
            
            return (
              <Card 
                key={proyecto.id} 
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20 ${estado.bgGradient} animate-fade-in`}
                style={{ animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                {/* Gradiente de fondo según estado */}
                <div className={`absolute inset-0 bg-gradient-to-br ${estado.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity`} />
                
                <CardContent className="relative p-6 space-y-4">
                  {/* Header con icono de estado y badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-3 rounded-lg bg-background/80 backdrop-blur-sm ${estado.iconColor} shadow-sm`}>
                      <EstadoIcon className="h-6 w-6" />
                    </div>
                    <Badge 
                      variant={estado.color} 
                      className="flex-shrink-0 shadow-sm"
                    >
                      {estado.label}
                    </Badge>
                  </div>

                  {/* Título y descripción */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {proyecto.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {proyecto.descripcion}
                    </p>
                  </div>

                  {/* Información clave en grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs">
                      <IconCalendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">
                        {new Date(proyecto.fecha_creacion || '').toLocaleDateString('es-ES', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {proyecto.duracion_meses && (
                      <div className="flex items-center gap-2 text-xs">
                        <IconClock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">{proyecto.duracion_meses} meses</span>
                      </div>
                    )}
                    
                    {proyecto.presupuesto_estimado && (
                      <div className="flex items-center gap-2 text-xs col-span-2">
                        <IconCoin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">
                          {formatMoneda(proyecto.presupuesto_estimado)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs col-span-2">
                      <span className="text-muted-foreground">Versión:</span>
                      <span className="font-medium">v{proyecto.version}</span>
                    </div>
                  </div>

                  {/* Tutor y acciones */}
                  <div className="pt-3 border-t border-border/50 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      {proyecto.tutor_nombre ? (
                        <>
                          <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm">
                            <IconUser className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground block">Tutor asignado</span>
                            <span className="font-medium truncate block">
                              {proyecto.tutor_nombre} {proyecto.tutor_apellido}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm">
                            <IconUser className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                          <span className="text-sm text-muted-foreground">Sin tutor asignado</span>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <AsignarTutor
                        proyecto={proyecto}
                        onProyectoActualizado={(proyectoActualizado) => {
                          setProyectos(prev =>
                            prev.map(p =>
                              p.id === proyectoActualizado.id ? proyectoActualizado : p
                            )
                          )
                          onProyectoActualizado?.(proyectoActualizado)
                        }}
                      />
                    </div>
                  </div>

                  {/* Información adicional (fechas importantes) */}
                  {(proyecto.fecha_envio || proyecto.fecha_revision || proyecto.fecha_aprobacion || proyecto.observaciones) && (
                    <div className="pt-3 border-t border-border/50 space-y-2">
                      <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                        {proyecto.fecha_envio && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            <span>Enviado: {formatFecha(proyecto.fecha_envio)}</span>
                          </div>
                        )}
                        {proyecto.fecha_revision && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-purple-500" />
                            <span>Revisado: {formatFecha(proyecto.fecha_revision)}</span>
                          </div>
                        )}
                        {proyecto.fecha_aprobacion && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-green-500" />
                            <span>Aprobado: {formatFecha(proyecto.fecha_aprobacion)}</span>
                          </div>
                        )}
                      </div>
                      {proyecto.observaciones && (
                        <div className="mt-2 p-2 rounded-md bg-background/60 backdrop-blur-sm text-xs">
                          <span className="font-medium text-foreground">Observaciones:</span>
                          <p className="text-muted-foreground mt-1 line-clamp-2">{proyecto.observaciones}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
