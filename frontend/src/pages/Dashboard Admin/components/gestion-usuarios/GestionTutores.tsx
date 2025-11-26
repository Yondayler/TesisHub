import * as React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CrearTutor } from "./CrearTutor"
import { usuarioService } from "@/services/usuarioService"
import { Usuario } from "@/types"
import { IconUserPlus, IconUsers, IconUserCheck, IconPlus, IconTrendingUp, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function GestionTutores() {
  const [tutores, setTutores] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tutorAEliminar, setTutorAEliminar] = useState<Usuario | null>(null)
  const [isEliminando, setIsEliminando] = useState(false)

  useEffect(() => {
    cargarTutores()
  }, [])

  const cargarTutores = async () => {
    try {
      setIsLoading(true)
      const data = await usuarioService.obtenerTutores()
      setTutores(data)
    } catch (error: any) {
      console.error("Error al cargar tutores:", error)
      toast.error("Error al cargar la lista de tutores")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTutorCreado = (tutor: Usuario) => {
    // Recargar la lista de tutores
    cargarTutores()
  }

  const handleEliminarTutor = async () => {
    if (!tutorAEliminar?.id) return

    setIsEliminando(true)
    try {
      await usuarioService.eliminarTutor(tutorAEliminar.id)
      toast.success("Tutor eliminado", {
        description: `El tutor ${tutorAEliminar.nombre} ${tutorAEliminar.apellido} ha sido eliminado exitosamente`
      })
      setTutorAEliminar(null)
      cargarTutores()
    } catch (error: any) {
      console.error("Error al eliminar tutor:", error)
      toast.error("Error al eliminar tutor", {
        description: error.response?.data?.message || "No se pudo eliminar el tutor"
      })
    } finally {
      setIsEliminando(false)
    }
  }


  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 animate-slide-in" style={{ animationDelay: '0.05s', opacity: 0, animationFillMode: 'forwards' }}>
        <div>
          <h1 className="text-4xl font-bold">Tutores</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los tutores del sistema educativo
          </p>
        </div>
        <CrearTutor onTutorCreado={handleTutorCreado} />
      </div>

      {/* Contenedor principal con padding consistente */}
      <div className="px-4 lg:px-6 space-y-8">
        {/* Estadísticas */}
        <div
          className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-3 @5xl/main:grid-cols-3 animate-fade-in"
          style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}
        >
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Tutores</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {tutores.length}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconUsers className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-green-600 dark:text-green-400">
              Sistema educativo fortalecido <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Tutores registrados en la plataforma
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Tutores Activos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {tutores.filter(t => t.activo === 1).length}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconUserCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-blue-600 dark:text-blue-400">
              {tutores.filter(t => t.activo === 1).length === tutores.length ? 'Todos activos' : 'Disponibles para asignación'} <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Tutores listos para trabajar
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Nuevos este Mes</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {tutores.filter(t => {
                const fechaRegistro = new Date(t.fecha_registro || '')
                const haceUnMes = new Date()
                haceUnMes.setMonth(haceUnMes.getMonth() - 1)
                return fechaRegistro >= haceUnMes
              }).length}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <IconUserPlus className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium text-purple-600 dark:text-purple-400">
              Crecimiento continuo <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Nuevas incorporaciones recientes
            </div>
          </CardFooter>
        </Card>
        </div>

        {/* Lista de Tutores */}
        <Card
          className="animate-scale-in"
          style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
        >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Lista de Tutores
          </CardTitle>
          <CardDescription>
            Todos los tutores registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tutores.length === 0 ? (
            <div className="text-center py-12">
              <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay tutores registrados</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando el primer tutor del sistema
              </p>
              <CrearTutor>
                <Button>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Crear Primer Tutor
                </Button>
              </CrearTutor>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutores.map((tutor) => (
                <Card key={tutor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{tutor.nombre} {tutor.apellido}</h3>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tutor.activo === 1
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tutor.activo === 1 ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {tutor.cedula && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cédula:</span>
                          <span>{tutor.cedula}</span>
                        </div>
                      )}
                      {tutor.telefono && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Teléfono:</span>
                          <span>{tutor.telefono}</span>
                        </div>
                      )}
                      {tutor.fecha_registro && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registrado:</span>
                          <span>{new Date(tutor.fecha_registro).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border">
                      <Dialog open={tutorAEliminar?.id === tutor.id} onOpenChange={(open) => !open && setTutorAEliminar(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => setTutorAEliminar(tutor)}
                          >
                            <IconTrash className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>¿Eliminar tutor?</DialogTitle>
                            <DialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el tutor{" "}
                              <span className="font-semibold">{tutor.nombre} {tutor.apellido}</span> del sistema.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setTutorAEliminar(null)}
                              disabled={isEliminando}
                            >
                              Cancelar
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleEliminarTutor}
                              disabled={isEliminando}
                            >
                              {isEliminando ? "Eliminando..." : "Eliminar"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
