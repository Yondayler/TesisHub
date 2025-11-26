"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { ListaEstudiantes } from "./ListaEstudiantes"
import { ProyectosEstudiante } from "./ProyectosEstudiante"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usuarioService } from "@/services/usuarioService"
import { proyectoService } from "@/services/proyectoService"
import { Usuario, EstadisticasProyecto } from "@/types"
import { IconUsers, IconUser, IconFolderOpen, IconTrendingUp } from "@tabler/icons-react"
import { toast } from "sonner"

type VistaActiva = 'estudiantes' | 'proyectos-estudiante'

export function GestionUsuarios() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('estudiantes')
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Usuario | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasProyecto | null>(null)
  const [estudiantesCount, setEstudiantesCount] = useState(0)

  useEffect(() => {
    if (vistaActiva === 'estudiantes') {
      cargarEstadisticas()
      cargarEstudiantesCount()
    }
  }, [vistaActiva])

  const cargarEstadisticas = async () => {
    try {
      const stats = await proyectoService.obtenerEstadisticas()
      setEstadisticas(stats)
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error)
    }
  }

  const cargarEstudiantesCount = async () => {
    try {
      const estudiantes = await usuarioService.obtenerEstudiantes()
      setEstudiantesCount(estudiantes.length)
    } catch (error: any) {
      console.error("Error al cargar estudiantes:", error)
    }
  }

  const handleEstudianteSeleccionado = (estudiante: Usuario) => {
    setEstudianteSeleccionado(estudiante)
    setVistaActiva('proyectos-estudiante')
  }

  const handleVolverAEstudiantes = () => {
    setVistaActiva('estudiantes')
    setEstudianteSeleccionado(null)
  }

  if (vistaActiva === 'proyectos-estudiante' && estudianteSeleccionado) {
    return (
      <ProyectosEstudiante
        estudiante={estudianteSeleccionado}
        onVolver={handleVolverAEstudiantes}
      />
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <h1 className="text-4xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona los estudiantes y sus proyectos académicos
        </p>
      </div>

      {/* Contenedor principal con padding consistente */}
      <div className="px-4 lg:px-6 space-y-8">
        {/* Estadísticas */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-0 @xl/main:grid-cols-4 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Estudiantes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {estudiantesCount}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconUsers className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-600 dark:text-blue-400">
              Comunidad estudiantil activa <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Estudiantes registrados en la plataforma
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Proyectos Totales</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {estadisticas?.total || 0}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconFolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600 dark:text-green-400">
              Trabajo académico continuo <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Proyectos presentados al sistema
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>En Revisión</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {estadisticas?.en_revision || 0}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconTrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600 dark:text-purple-400">
              Proceso de evaluación activo <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Proyectos bajo revisión académica
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Aprobados</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {estadisticas?.aprobados || 0}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconUser className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-orange-600 dark:text-orange-400">
              Éxito académico logrado <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Proyectos aprobados exitosamente
            </div>
          </CardFooter>
        </Card>
        </div>

        {/* Lista de Estudiantes */}
        <ListaEstudiantes onEstudianteSeleccionado={handleEstudianteSeleccionado} />
      </div>
    </div>
  )
}
