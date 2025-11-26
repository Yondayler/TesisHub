"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { notificacionService } from "@/services/notificacionService"
import { Notificacion } from "@/types"
import { IconBell, IconCheck, IconTrash, IconEye } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationDropdownProps {
  onNotificationCountChange?: (count: number) => void
  onDataRefresh?: () => void
}

export function NotificationDropdown({ onNotificationCountChange, onDataRefresh }: NotificationDropdownProps) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidasCount, setNoLeidasCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    cargarNotificaciones()
    cargarConteoNoLeidas()

    // Polling para actualizar notificaciones cada 30 segundos
    const interval = setInterval(() => {
      cargarConteoNoLeidas()
      // Solo recargar notificaciones si el dropdown está abierto
      if (isOpen) {
        cargarNotificaciones()
      }
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && !isClosing) {
      // Pequeño delay para permitir que el DOM se actualice antes de animar
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 10)
      return () => clearTimeout(timer)
    } else if (!isOpen) {
      setIsVisible(false)
      setIsClosing(false)
    }
  }, [isOpen, isClosing])

  const cargarNotificaciones = async () => {
    try {
      const data = await notificacionService.obtenerNotificaciones()
      setNotificaciones(data)
    } catch (error: any) {
      console.error("Error al cargar notificaciones:", error)
    }
  }

  const cargarConteoNoLeidas = async () => {
    try {
      const count = await notificacionService.contarNoLeidas()
      setNoLeidasCount(count)
      onNotificationCountChange?.(count)
    } catch (error: any) {
      console.error("Error al contar notificaciones:", error)
    }
  }

  const handleMarcarComoLeida = async (id: number) => {
    try {
      await notificacionService.marcarComoLeida(id)
      // Actualizar la notificación localmente
      setNotificaciones(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, leida: 1 } : notif
        )
      )
      setNoLeidasCount(prev => Math.max(0, prev - 1))
      onNotificationCountChange?.(Math.max(0, noLeidasCount - 1))

      // Refrescar datos si hay callback (útil para actualizaciones como asignación de tutor)
      onDataRefresh?.()
    } catch (error: any) {
      console.error("Error al marcar notificación como leída:", error)
      toast.error("Error al marcar notificación como leída")
    }
  }

  const handleMarcarTodasComoLeidas = async () => {
    if (noLeidasCount === 0) return

    try {
      setIsLoading(true)
      await notificacionService.marcarTodasComoLeidas()
      // Actualizar todas las notificaciones localmente
      setNotificaciones(prev =>
        prev.map(notif => ({ ...notif, leida: 1 }))
      )
      setNoLeidasCount(0)
      onNotificationCountChange?.(0)
      toast.success("Todas las notificaciones han sido marcadas como leídas")
    } catch (error: any) {
      console.error("Error al marcar todas como leídas:", error)
      toast.error("Error al marcar todas las notificaciones como leídas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEliminarNotificacion = async (id: number) => {
    try {
      await notificacionService.eliminarNotificacion(id)
      // Remover la notificación localmente
      setNotificaciones(prev => prev.filter(notif => notif.id !== id))
      toast.success("Notificación eliminada")
    } catch (error: any) {
      console.error("Error al eliminar notificación:", error)
      toast.error("Error al eliminar notificación")
    }
  }

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "Hace un momento"
    try {
      return formatDistanceToNow(new Date(fecha), {
        addSuffix: true,
        locale: es
      })
    } catch {
      return "Fecha desconocida"
    }
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'asignacion':
        return '👨‍🏫'
      case 'aprobacion':
        return '✅'
      case 'rechazo':
        return '❌'
      case 'revision':
        return '📋'
      case 'comentario':
        return '💬'
      default:
        return '🔔'
    }
  }

  const handleToggle = () => {
    if (isOpen) {
      // Iniciar animación de cierre
      setIsClosing(true)
      setIsVisible(false)
      // Después de la animación, cerrar completamente
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 400) // Duración de la animación de salida
    } else {
      setIsOpen(true)
      setIsClosing(false)
      // Recargar notificaciones cuando se abre el dropdown
      cargarNotificaciones()
      cargarConteoNoLeidas()
    }
  }

  const handleClose = () => {
    if (isOpen && !isClosing) {
      setIsClosing(true)
      setIsVisible(false)
      setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 400) // Duración de la animación de salida
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={handleToggle}
      >
        <IconBell className="h-4 w-4 text-foreground" />
        {noLeidasCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {noLeidasCount > 99 ? '99+' : noLeidasCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className={`absolute right-0 top-12 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden ${
          isClosing 
            ? 'animate-auth-scale-out pointer-events-none' 
            : isVisible 
            ? 'animate-auth-scale-in pointer-events-auto' 
            : 'opacity-0 scale-95 pointer-events-none'
        }`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-popover-foreground">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {noLeidasCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarcarTodasComoLeidas}
                    disabled={isLoading}
                    className="text-xs h-8"
                  >
                    <IconCheck className="h-3 w-3 mr-1" />
                    Marcar todas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <IconBell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notificaciones.map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className={`p-4 hover:bg-muted ${
                      notificacion.leida === 0 ? 'bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-lg mt-0.5">{getIconoTipo(notificacion.tipo_notificacion)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate text-foreground">
                              {notificacion.titulo}
                            </p>
                            {notificacion.leida === 0 && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {notificacion.mensaje}
                          </p>
                          {notificacion.proyecto_titulo && (
                            <p className="text-xs text-primary mb-1">
                              Proyecto: {notificacion.proyecto_titulo}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatFecha(notificacion.fecha_creacion)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        {notificacion.leida === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarcarComoLeida(notificacion.id!)
                            }}
                            className="h-6 w-6 p-0"
                            title="Marcar como leída"
                          >
                            <IconEye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEliminarNotificacion(notificacion.id!)
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                          title="Eliminar notificación"
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar al hacer click fuera */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClose}
        />
      )}
    </div>
  )
}
