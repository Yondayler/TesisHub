'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  IconHistory,
  IconPlus,
  IconPencil,
  IconTrash,
  IconUserShield,
  IconUsers,
  IconInfoCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { usuarioService } from "@/services/usuarioService"
import { auditoriaService } from "@/services/auditoriaService"
import { Usuario } from "@/types"
import type { Auditoria } from "@/services/auditoriaService"

interface AdminFormState {
  id?: number
  nombre: string
  apellido: string
  email: string
  password: string
}

export function SettingsAdmin() {
  const [admins, setAdmins] = useState<Usuario[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [form, setForm] = useState<AdminFormState>({ nombre: "", apellido: "", email: "", password: "" })
  const [guardando, setGuardando] = useState<boolean>(false)
  const [adminEditando, setAdminEditando] = useState<Usuario | null>(null)
  const [auditoria, setAuditoria] = useState<Auditoria[]>([])
  const [loadingAuditoria, setLoadingAuditoria] = useState<boolean>(true)

  useEffect(() => {
    cargarAdmins()
    cargarAuditoria()
  }, [])

  const cargarAdmins = async (): Promise<void> => {
    try {
      setLoading(true)
      const administradores = await usuarioService.obtenerAdministradores()
      setAdmins(administradores)
    } catch (error: any) {
      console.error("Error al cargar administradores:", error)
      toast.error(error.message || "Error al cargar administradores")
    } finally {
      setLoading(false)
    }
  }

  const cargarAuditoria = async (): Promise<void> => {
    try {
      setLoadingAuditoria(true)
      const response = await auditoriaService.obtenerTodos(50) // Últimos 50 registros
      setAuditoria(response.registros || [])
    } catch (error: any) {
      console.error("Error al cargar auditoría:", error)
      toast.error(error.message || "Error al cargar auditoría")
    } finally {
      setLoadingAuditoria(false)
    }
  }

  const limpiarFormulario = (): void => {
    setForm({ nombre: "", apellido: "", email: "", password: "" })
    setAdminEditando(null)
  }

  const handleChange = (campo: keyof AdminFormState, valor: string): void => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleGuardar = async (): Promise<void> => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
      toast.error("Completa todos los campos requeridos")
      return
    }

    // Si es creación, la contraseña es obligatoria
    if (!adminEditando && !form.password.trim()) {
      toast.error("La contraseña es obligatoria para crear un administrador")
      return
    }

    try {
      setGuardando(true)
      
      if (adminEditando) {
        // Actualizar administrador
        const datosActualizacion: any = {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
        }
        
        // Solo incluir password si se proporcionó
        if (form.password.trim()) {
          datosActualizacion.password = form.password
        }
        
        await usuarioService.actualizarAdministrador(adminEditando.id!, datosActualizacion)
        toast.success("Administrador actualizado exitosamente")
      } else {
        // Crear administrador
        if (!form.password.trim()) {
          toast.error("La contraseña es obligatoria")
          return
        }
        
        await usuarioService.crearAdministrador({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
        })
        toast.success("Administrador creado exitosamente")
      }
      
      limpiarFormulario()
      await cargarAdmins()
      await cargarAuditoria() // Recargar auditoría para ver el nuevo registro
    } catch (error: any) {
      console.error("Error al guardar administrador:", error)
      toast.error(error.message || "Error al guardar administrador")
    } finally {
      setGuardando(false)
    }
  }

  const handleEditar = (admin: Usuario): void => {
    setAdminEditando(admin)
    setForm({
      id: admin.id,
      nombre: admin.nombre || "",
      apellido: admin.apellido || "",
      email: admin.email || "",
      password: "", // No mostrar la contraseña actual
    })
  }

  const handleEliminar = async (admin: Usuario): Promise<void> => {
    if (!confirm(`¿Estás seguro de eliminar al administrador ${admin.nombre} ${admin.apellido}?`)) {
      return
    }

    try {
      await usuarioService.eliminarAdministrador(admin.id!)
      toast.success(`Administrador eliminado: ${admin.nombre} ${admin.apellido}`)
      await cargarAdmins()
      await cargarAuditoria() // Recargar auditoría para ver el registro de eliminación
    } catch (error: any) {
      console.error("Error al eliminar administrador:", error)
      toast.error(error.message || "Error al eliminar administrador")
    }
  }

  const formatearFecha = (fecha?: string): string => {
    if (!fecha) return "N/A"
    try {
      return new Date(fecha).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return fecha
    }
  }

  const obtenerAccionTexto = (accion: string): string => {
    const acciones: Record<string, string> = {
      CREAR: "Crear",
      ACTUALIZAR: "Actualizar",
      ELIMINAR: "Eliminar",
      ASIGNAR_TUTOR: "Asignar Tutor",
    }
    return acciones[accion] || accion
  }

  const obtenerEntidadTexto = (entidad: string): string => {
    const entidades: Record<string, string> = {
      ADMINISTRADOR: "Administrador",
      TUTOR: "Tutor",
      PROYECTO: "Proyecto",
    }
    return entidades[entidad] || entidad
  }

  // Verificar si es el administrador inicial
  const esAdminInicial = (admin: Usuario): boolean => {
    return admin.email === 'admin@tesishub.com'
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div
        className="flex flex-col gap-2 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6 animate-slide-in"
        style={{ animationDelay: "0.05s", opacity: 0, animationFillMode: "forwards" }}
      >
        <div>
          <h1 className="text-4xl font-bold">Configuración del Sistema</h1>
          <p className="mt-2 text-muted-foreground">
            Administra administradores y revisa la auditoría del sistema.
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-6 space-y-8">
        {/* Tarjetas resumen */}
        <div
          className="grid grid-cols-1 gap-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card md:grid-cols-2 animate-fade-in"
          style={{ animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}
        >
          <Card className="@container/card" data-slot="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconUserShield className="h-5 w-5" />
                Administradores
              </CardTitle>
              <CardDescription>Gestión de cuentas administrativas.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Total: {loading ? "..." : admins.length} administrador{admins.length !== 1 ? "es" : ""}
            </CardContent>
          </Card>

          <Card className="@container/card" data-slot="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconHistory className="h-5 w-5" />
                Auditoría
              </CardTitle>
              <CardDescription>Registro de actividad administrativa.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {loadingAuditoria ? "Cargando..." : `${auditoria.length} registros recientes`}
            </CardContent>
          </Card>
        </div>

        {/* Gestión de administradores */}
        <Card
          className="animate-scale-in"
          style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Administradores del sistema
            </CardTitle>
            <CardDescription>
              {adminEditando
                ? "Edita la información del administrador seleccionado."
                : "Crea nuevos administradores para delegar tareas de gestión."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Formulario */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="admin-nombre">Nombre *</Label>
                <Input
                  id="admin-nombre"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-apellido">Apellido *</Label>
                <Input
                  id="admin-apellido"
                  value={form.apellido}
                  onChange={(e) => handleChange("apellido", e.target.value)}
                  placeholder="Apellido"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Correo electrónico *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="admin@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">
                  Contraseña {adminEditando ? "(opcional)" : "*"}
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder={adminEditando ? "Dejar vacío para no cambiar" : "Contraseña"}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleGuardar} disabled={guardando} className="gap-2">
                {guardando ? (
                  "Guardando..."
                ) : (
                  <>
                    <IconPlus className="h-4 w-4" />
                    {adminEditando ? "Actualizar administrador" : "Crear administrador"}
                  </>
                )}
              </Button>
              {adminEditando && (
                <Button variant="outline" onClick={limpiarFormulario} type="button">
                  Cancelar edición
                </Button>
              )}
            </div>

            <Separator />

            {/* Lista de admins */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay administradores registrados.
              </p>
            ) : (
              <div className="grid gap-3">
                {admins.map((admin) => {
                  const esInicial = esAdminInicial(admin)
                  return (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {admin.nombre} {admin.apellido}
                          </span>
                          <span className="text-xs text-muted-foreground">{admin.email}</span>
                        </div>
                        {esInicial && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              >
                                <IconInfoCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Administrador Principal</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Este es el administrador principal del sistema. Por razones de seguridad,
                                  no se puede editar ni eliminar esta cuenta. Esta cuenta es esencial para
                                  el funcionamiento del sistema y garantiza que siempre haya al menos un
                                  administrador disponible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Entendido</AlertDialogCancel>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      {!esInicial && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleEditar(admin)}
                          >
                            <IconPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleEliminar(admin)}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auditoría */}
        <Card
          className="animate-scale-in"
          style={{ animationDelay: "0.45s", opacity: 0, animationFillMode: "forwards" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHistory className="h-5 w-5" />
              Registro de Auditoría
            </CardTitle>
            <CardDescription>
              Historial de acciones realizadas por administradores del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAuditoria ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : auditoria.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay registros de auditoría disponibles.
              </p>
            ) : (
              <div className="space-y-3">
                {auditoria.map((registro) => (
                  <div
                    key={registro.id}
                    className="rounded-md border bg-card p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {obtenerAccionTexto(registro.accion)} {obtenerEntidadTexto(registro.entidad)}
                          </span>
                          {registro.entidad_id && (
                            <span className="text-xs text-muted-foreground">
                              (ID: {registro.entidad_id})
                            </span>
                          )}
                        </div>
                        {registro.detalles && (
                          <p className="text-xs text-muted-foreground">{registro.detalles}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Por: {registro.administrador_nombre} {registro.administrador_apellido}
                          </span>
                          <span>{formatearFecha(registro.fecha_accion)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
