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
    icon: IconFileText,
  },
  enviado: { 
    label: "Enviado", 
    color: "default" as const,
    icon: IconFileDescription,
  },
  en_revision: { 
    label: "En Revisión", 
    color: "outline" as const,
    icon: IconClockHour4,
  },
  aprobado: { 
    label: "Aprobado", 
    color: "default" as const,
    icon: IconCheck,
  },
  rechazado: { 
    label: "Rechazado", 
    color: "destructive" as const,
    icon: IconX,
  },
  corregir: { 
    label: "Corregir", 
    color: "outline" as const,
    icon: IconEdit,
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
            <div className="text-2xl font-bold text-center text-foreground">
              {proyectos.filter(p => p.estado === 'aprobado').length}
            </div>
            <div className="text-sm text-muted-foreground text-center">Aprobados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-foreground">
              {proyectos.filter(p => p.estado === 'en_revision').length}
            </div>
            <div className="text-sm text-muted-foreground text-center">En Revisión</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-center text-destructive">
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
                className="group transition-all duration-200 hover:shadow-md hover:border-primary/50 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Header con badge de estado */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-muted">
                        <EstadoIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                          {proyecto.titulo}
                        </h3>
                      </div>
                    </div>
                    <Badge 
                      variant={estado.color} 
                      className="flex-shrink-0"
                    >
                      {estado.label}
                    </Badge>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {proyecto.descripcion}
                  </p>

                  {/* Información clave */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconCalendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        {new Date(proyecto.fecha_creacion || '').toLocaleDateString('es-ES', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {proyecto.duracion_meses && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconClock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{proyecto.duracion_meses} meses</span>
                      </div>
                    )}
                    
                    {proyecto.presupuesto_estimado && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconCoin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {formatMoneda(proyecto.presupuesto_estimado)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Versión:</span>
                      <span className="font-medium text-foreground">v{proyecto.version}</span>
                    </div>
                  </div>

                  {/* Tutor y Acciones */}
                  <div className="pt-2 border-t border-border">
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

                  {/* Información adicional (fechas importantes) */}
                  {(proyecto.fecha_envio || proyecto.fecha_revision || proyecto.fecha_aprobacion || proyecto.observaciones) && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {proyecto.fecha_envio && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                            <span>Enviado: {formatFecha(proyecto.fecha_envio)}</span>
                          </div>
                        )}
                        {proyecto.fecha_revision && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                            <span>Revisado: {formatFecha(proyecto.fecha_revision)}</span>
                          </div>
                        )}
                        {proyecto.fecha_aprobacion && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                            <span>Aprobado: {formatFecha(proyecto.fecha_aprobacion)}</span>
                          </div>
                        )}
                      </div>
                      {proyecto.observaciones && (
                        <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs">
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
