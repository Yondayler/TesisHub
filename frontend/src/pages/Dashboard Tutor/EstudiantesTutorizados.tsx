"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { tutorService, EstudianteTutorizado } from "@/services/tutorService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Mail, 
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export function EstudiantesTutorizados() {
  const navigate = useNavigate()
  const [estudiantes, setEstudiantes] = useState<EstudianteTutorizado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstudiantes()
  }, [])

  const cargarEstudiantes = async () => {
    try {
      setLoading(true)
      const data = await tutorService.obtenerEstudiantesTutorizados()
      setEstudiantes(data)
    } catch (error: any) {
      toast.error('Error al cargar estudiantes', {
        description: error.response?.data?.message || 'No se pudieron cargar los estudiantes tutorizados'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerProyectos = async (estudianteId: number) => {
    try {
      const proyectos = await tutorService.obtenerProyectosPorEstudiante(estudianteId)
      if (proyectos.length === 0) {
        toast.info('Sin proyectos', {
          description: 'Este estudiante aún no tiene proyectos asignados'
        })
        return
      }
      // Navegar al primer proyecto o mostrar lista
      if (proyectos[0]?.id) {
        navigate(`/proyectos/${proyectos[0].id}`)
      }
    } catch (error: any) {
      toast.error('Error al cargar proyectos', {
        description: error.response?.data?.message || 'No se pudieron cargar los proyectos'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard-tutor')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estudiantes Tutorizados</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los proyectos de tus estudiantes asignados
            </p>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Estudiantes</CardDescription>
              <CardTitle className="text-2xl">{estudiantes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Proyectos</CardDescription>
              <CardTitle className="text-2xl">
                {estudiantes.reduce((sum, e) => sum + e.total_proyectos, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>En Revisión</CardDescription>
              <CardTitle className="text-2xl">
                {estudiantes.reduce((sum, e) => sum + e.proyectos_en_revision, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aprobados</CardDescription>
              <CardTitle className="text-2xl">
                {estudiantes.reduce((sum, e) => sum + e.proyectos_aprobados, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla de Estudiantes */}
        {estudiantes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Empty>
                <EmptyMedia variant="icon">
                  <User className="h-8 w-8 text-muted-foreground" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No hay estudiantes asignados</EmptyTitle>
                  <EmptyDescription>
                    Aún no tienes estudiantes asignados. Los estudiantes aparecerán aquí cuando te sean asignados como tutor.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Estudiantes</CardTitle>
              <CardDescription>
                Haz clic en un estudiante para ver sus proyectos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Total Proyectos</TableHead>
                    <TableHead>Estados</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudiantes.map((estudiante) => (
                    <TableRow
                      key={estudiante.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleVerProyectos(estudiante.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {estudiante.nombre} {estudiante.apellido}
                            </div>
                            {estudiante.cedula && (
                              <div className="text-sm text-muted-foreground">
                                C.I.: {estudiante.cedula}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{estudiante.email}</span>
                          </div>
                          {estudiante.telefono && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{estudiante.telefono}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{estudiante.total_proyectos}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {estudiante.proyectos_en_revision > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {estudiante.proyectos_en_revision} en revisión
                            </Badge>
                          )}
                          {estudiante.proyectos_aprobados > 0 && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {estudiante.proyectos_aprobados} aprobados
                            </Badge>
                          )}
                          {estudiante.proyectos_corregir > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {estudiante.proyectos_corregir} por corregir
                            </Badge>
                          )}
                          {estudiante.proyectos_rechazados > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              {estudiante.proyectos_rechazados} rechazados
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVerProyectos(estudiante.id)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Proyectos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


