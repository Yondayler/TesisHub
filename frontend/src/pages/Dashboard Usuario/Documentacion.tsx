"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { proyectoService } from "@/services/proyectoService"
import { Proyecto } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "./components/app-sidebar"
import { SiteHeader } from "./components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  BookOpen,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Upload,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react"
import introJs from "intro.js"
import "intro.js/introjs.css"
import "./intro-custom.css"

export function Documentacion() {
  const { usuario, loading: authLoading } = useAuth()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loadingProyectos, setLoadingProyectos] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const tourStarted = useRef(false)

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
      // Silenciar errores en la documentación
    } finally {
      setLoadingProyectos(false)
    }
  }

  const refrescarDatos = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const iniciarTour = () => {
    const intro = introJs()
    
    intro.setOptions({
      steps: [
        {
          intro: "¡Bienvenido al Manual de Usuario! Este tour te guiará por las principales funcionalidades del sistema."
        },
        {
          element: document.querySelector('[data-tour="dashboard-header"]'),
          intro: "Aquí encontrarás el encabezado principal con información de bienvenida y estadísticas rápidas."
        },
        {
          element: document.querySelector('[data-tour="proyectos-section"]'),
          intro: "En esta sección puedes ver todos tus proyectos. Puedes crear nuevos, editar existentes o ver detalles."
        },
        {
          element: document.querySelector('[data-tour="sidebar"]'),
          intro: "El menú lateral te permite navegar rápidamente entre diferentes secciones del sistema."
        },
        {
          element: document.querySelector('[data-tour="stats-cards"]'),
          intro: "Estas tarjetas muestran estadísticas importantes sobre tus proyectos de forma visual."
        },
        {
          element: document.querySelector('[data-tour="actions"]'),
          intro: "Desde aquí puedes realizar acciones rápidas como crear un nuevo proyecto o filtrar los existentes."
        },
        {
          intro: "¡Has completado el tour! Explora el sistema y no dudes en consultar esta documentación cuando lo necesites."
        }
      ],
      showProgress: false,
      showBullets: false,
      showButtons: true,
      showStepNumbers: false,
      exitOnOverlayClick: true,
      exitOnEsc: true,
      disableInteraction: false,
      highlightClass: 'introjs-highlight-modern',
      tooltipClass: 'introjs-tooltip-modern',
      nextLabel: '→',
      prevLabel: '←',
      skipLabel: '✕',
      doneLabel: '✓'
    })

    intro.start()
    tourStarted.current = true
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
      <div data-tour="sidebar">
        <AppSidebar variant="inset" proyectos={proyectos} />
      </div>
      <SidebarInset>
        <SiteHeader onRefreshData={refrescarDatos} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6 animate-slide-in" data-tour="dashboard-header">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BookOpen className="h-8 w-8" />
                        Manual de Usuario
                      </h1>
                      <p className="mt-2 text-muted-foreground">
                        Guía completa para usar el Sistema de Gestión de Proyectos
                      </p>
                    </div>
                    <Button onClick={iniciarTour} className="gap-2">
                      <Play className="h-4 w-4" />
                      Iniciar Tour Guiado
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sección de Estadísticas - Ejemplo */}
              <div className="px-4 lg:px-6 grid grid-cols-1 md:grid-cols-4 gap-4" data-tour="stats-cards">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total de Proyectos</CardDescription>
                    <CardTitle className="text-2xl">12</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BarChart3 className="h-4 w-4" />
                      <span>En progreso</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Proyectos Aprobados</CardDescription>
                    <CardTitle className="text-2xl">5</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Completados</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>En Revisión</CardDescription>
                    <CardTitle className="text-2xl">3</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-yellow-500">
                      <Clock className="h-4 w-4" />
                      <span>Pendientes</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Rechazados</CardDescription>
                    <CardTitle className="text-2xl">2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <XCircle className="h-4 w-4" />
                      <span>Requieren corrección</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sección de Proyectos - Ejemplo */}
              <div className="px-4 lg:px-6 animate-fade-in" data-tour="proyectos-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Proyectos de Ejemplo</h2>
                  <div className="flex gap-2" data-tour="actions">
                    <Button variant="outline">Filtrar</Button>
                    <Button>Nuevo Proyecto</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Proyecto Ejemplo 1 */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">Proyecto de Investigación A</CardTitle>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          Aprobado
                        </Badge>
                      </div>
                      <CardDescription>
                        Sistema de gestión para pequeñas empresas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>5 archivos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>3 comentarios</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Actualizado hace 2 días</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proyecto Ejemplo 2 */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">Proyecto de Investigación B</CardTitle>
                        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          En Revisión
                        </Badge>
                      </div>
                      <CardDescription>
                        Aplicación móvil para gestión de tareas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>8 archivos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>1 comentario</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Actualizado hace 5 días</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Proyecto Ejemplo 3 */}
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">Proyecto de Investigación C</CardTitle>
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          Enviado
                        </Badge>
                      </div>
                      <CardDescription>
                        Plataforma web para educación en línea
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>12 archivos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>0 comentarios</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Actualizado hoy</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Guías de Uso */}
              <div className="px-4 lg:px-6 space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Guías de Uso</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <CardTitle>Crear un Proyecto</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Para crear un nuevo proyecto:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Haz clic en el botón "Nuevo Proyecto"</li>
                        <li>Completa el formulario con la información requerida</li>
                        <li>Agrega una descripción detallada de tu proyecto</li>
                        <li>Guarda el proyecto como borrador o envíalo directamente</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        <CardTitle>Subir Archivos</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Para subir archivos a tu proyecto:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Abre el proyecto desde la lista o el sidebar</li>
                        <li>Ve a la sección "Archivos"</li>
                        <li>Haz clic en "Subir Archivo"</li>
                        <li>Selecciona los archivos que deseas subir</li>
                        <li>Espera a que se complete la carga</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <CardTitle>Comunicarse con Tutores</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Para comunicarte con tu tutor:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Accede a la sección de chat del proyecto</li>
                        <li>Escribe tu mensaje en el campo de texto</li>
                        <li>Presiona Enter o haz clic en "Enviar"</li>
                        <li>Puedes editar o eliminar tus mensajes</li>
                        <li>Recibirás notificaciones de nuevas respuestas</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle>Configuración de Cuenta</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Para configurar tu cuenta:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Ve a "Configuración" en el menú lateral</li>
                        <li>Actualiza tu información personal</li>
                        <li>Cambia tu contraseña si es necesario</li>
                        <li>Configura tus preferencias de notificaciones</li>
                        <li>Guarda los cambios</li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Preguntas Frecuentes */}
              <div className="px-4 lg:px-6 space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Preguntas Frecuentes</h2>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">¿Cómo cambio el estado de mi proyecto?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Puedes cambiar el estado de tu proyecto desde la página de detalles. Los estados disponibles son: Borrador, Enviado, En Revisión, Aprobado, Rechazado y Corregir.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">¿Qué tipos de archivos puedo subir?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Puedes subir documentos (PDF, DOC, DOCX), imágenes (JPG, PNG), presentaciones (PPT, PPTX) y otros formatos. El tamaño máximo por archivo es de 10MB.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">¿Cómo sé si mi proyecto fue revisado?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Recibirás una notificación cuando tu proyecto sea revisado. También puedes ver el estado actualizado en la lista de proyectos y en la página de detalles.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">¿Puedo editar un proyecto después de enviarlo?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Sí, puedes editar tu proyecto en cualquier momento. Si está en revisión o fue rechazado, puedes hacer las correcciones necesarias y volver a enviarlo.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Footer de Documentación */}
              <div className="px-4 lg:px-6 py-8 text-center text-sm text-muted-foreground">
                <p>¿Necesitas más ayuda? Contacta al soporte técnico o consulta la documentación completa.</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

