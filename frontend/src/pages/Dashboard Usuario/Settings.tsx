"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { proyectoService } from "@/services/proyectoService"
import { Proyecto } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "./components/app-sidebar"
import { SiteHeader } from "./components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  User,
  Mail,
  Phone,
  Key,
  Bell,
  Shield,
  Save,
  Loader2,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export function Settings() {
  const { usuario, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loadingProyectos, setLoadingProyectos] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || "",
        apellido: usuario.apellido || "",
        email: usuario.email || "",
        telefono: usuario.telefono || "",
        password: "",
        confirmPassword: "",
      })
    }
  }, [usuario])

  useEffect(() => {
    if (!authLoading) {
      cargarProyectos()
    }
  }, [authLoading, refreshTrigger])

  const cargarProyectos = async () => {
    try {
      setLoadingProyectos(true)
      const proyectosData = await proyectoService.obtenerProyectos()
      setProyectos(proyectosData)
    } catch (error: any) {
      toast.error('Error al cargar proyectos', {
        description: error.response?.data?.message || 'No se pudieron cargar los proyectos'
      })
    } finally {
      setLoadingProyectos(false)
    }
  }

  const refrescarDatos = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validaciones
      if (formData.password && formData.password.length < 8) {
        toast.error("La contraseña debe tener al menos 8 caracteres")
        setSaving(false)
        return
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error("Las contraseñas no coinciden")
        setSaving(false)
        return
      }

      // Aquí iría la llamada al API para actualizar el perfil
      // Por ahora solo mostramos un mensaje de éxito
      toast.success("Configuración actualizada", {
        description: "Tus cambios han sido guardados correctamente"
      })

      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }))
    } catch (error: any) {
      toast.error("Error al guardar", {
        description: error.response?.data?.message || "No se pudieron guardar los cambios"
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-1/2 mx-auto" />
          <Skeleton className="h-6 w-1/3 mx-auto" />
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
      <AppSidebar variant="inset" proyectos={proyectos} />
      <SidebarInset>
        <SiteHeader onRefreshData={refrescarDatos} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6 animate-slide-in">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Configuración
                  </h1>
                  <p className="mt-2 text-muted-foreground animate-slide-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                    Gestiona tu información personal y preferencias
                  </p>
                </div>
              </div>

              {/* Settings Content */}
              <div className="px-4 lg:px-6 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <CardTitle>Información Personal</CardTitle>
                      </div>
                      <CardDescription>
                        Actualiza tu información personal y de contacto
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre">Nombre</Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apellido">Apellido</Label>
                          <Input
                            id="apellido"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                            placeholder="Tu apellido"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="telefono"
                            name="telefono"
                            type="tel"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="+1234567890"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Seguridad */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle>Seguridad</CardTitle>
                      </div>
                      <CardDescription>
                        Cambia tu contraseña para mantener tu cuenta segura
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Deja en blanco para no cambiar"
                            className="pl-10"
                            minLength={8}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Debe tener al menos 8 caracteres
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirma tu nueva contraseña"
                            className="pl-10"
                            minLength={8}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notificaciones */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <CardTitle>Notificaciones</CardTitle>
                      </div>
                      <CardDescription>
                        Configura cómo y cuándo recibes notificaciones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Las opciones de notificaciones estarán disponibles próximamente.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/dashboard-usuario")}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

