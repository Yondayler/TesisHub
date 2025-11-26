"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { comentarioService, Comentario } from "@/services/comentarioService"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Send, 
  Loader2,
  User,
  Edit2,
  Trash2,
  MoreVertical
} from "lucide-react"
import { io, Socket } from "socket.io-client"
import { cn } from "@/lib/utils"
import { SimpleMenu, SimpleMenuItem, SimpleMenuSeparator } from "@/components/ui/simple-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatProyectoProps {
  proyectoId: number
  tutorNombre?: string
  tutorApellido?: string
  estudianteNombre?: string
  estudianteApellido?: string
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function ChatProyecto({ proyectoId, tutorNombre, tutorApellido, estudianteNombre, estudianteApellido }: ChatProyectoProps) {
  const { usuario, token } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoTexto, setEditandoTexto] = useState("")
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [usuarioEscribiendo, setUsuarioEscribiendo] = useState<{ id: number; nombre: string } | null>(null)
  const [indicadorSaliendo, setIndicadorSaliendo] = useState(false)
  const [mensajesNuevos, setMensajesNuevos] = useState<Set<number>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevComentariosLengthRef = useRef<number>(0)

  // Conectar Socket.io
  useEffect(() => {
    if (!token || !usuario) return

    const socketInstance = io(API_URL.replace('/api', ''), {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Conectado al servidor Socket.io')
      socketInstance.emit('join-project', proyectoId)
    })

    socketInstance.on('disconnect', () => {
      console.log('Desconectado del servidor Socket.io')
    })

    socketInstance.on('new-message', (data: any) => {
      // Recargar comentarios cuando llega un nuevo mensaje
      cargarComentarios()
    })

    socketInstance.on('user-typing', (data: { usuarioId: number; usuarioNombre: string }) => {
      // Solo mostrar si no es el usuario actual
      if (data.usuarioId !== usuario?.id) {
        setIndicadorSaliendo(false)
        setUsuarioEscribiendo({ id: data.usuarioId, nombre: data.usuarioNombre })
        // Limpiar después de 3 segundos sin actividad
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        typingTimeoutRef.current = setTimeout(() => {
          ocultarIndicadorEscribiendo()
        }, 3000)
      }
    })

    socketInstance.on('user-stopped-typing', (data: { usuarioId: number }) => {
      if (data.usuarioId !== usuario?.id) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        ocultarIndicadorEscribiendo()
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.emit('leave-project', proyectoId)
      socketInstance.disconnect()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [proyectoId, token, usuario])

  // Función para ocultar el indicador con animación
  const ocultarIndicadorEscribiendo = () => {
    setIndicadorSaliendo(true)
    setTimeout(() => {
      setUsuarioEscribiendo(null)
      setIndicadorSaliendo(false)
    }, 200) // Duración de la animación de salida
  }

  // Cargar comentarios
  const cargarComentarios = async () => {
    try {
      setLoading(true)
      const data = await comentarioService.obtenerComentariosPorProyecto(proyectoId)
      
      // Detectar mensajes nuevos
      if (prevComentariosLengthRef.current > 0 && data.length > prevComentariosLengthRef.current) {
        const nuevosIds = new Set<number>()
        data.slice(prevComentariosLengthRef.current).forEach(comentario => {
          if (comentario.id) {
            nuevosIds.add(comentario.id)
          }
        })
        setMensajesNuevos(nuevosIds)
        
        // Limpiar los IDs de mensajes nuevos después de la animación
        setTimeout(() => {
          setMensajesNuevos(new Set())
        }, 500)
      }
      
      prevComentariosLengthRef.current = data.length
      setComentarios(data)
    } catch (error: any) {
      toast.error('Error al cargar mensajes', {
        description: error.response?.data?.message || 'No se pudieron cargar los mensajes'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarComentarios()
  }, [proyectoId])

  // Auto-scroll al final
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comentarios])

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || enviando) return

    try {
      setEnviando(true)
      await comentarioService.crearComentario({
        proyecto_id: proyectoId,
        comentario: nuevoMensaje.trim(),
        tipo_comentario: 'general'
      })

      // Enviar evento Socket.io
      if (socket) {
        socket.emit('send-message', {
          proyectoId,
          comentario: nuevoMensaje.trim(),
          tipo_comentario: 'general'
        })
      }

      setNuevoMensaje("")
      
      // Detener indicador de "escribiendo"
      if (socket) {
        socket.emit('stop-typing', {
          proyectoId,
          usuarioId: usuario?.id
        })
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      await cargarComentarios()
      
      // Auto-focus en el textarea
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (error: any) {
      toast.error('Error al enviar mensaje', {
        description: error.response?.data?.message || 'No se pudo enviar el mensaje'
      })
    } finally {
      setEnviando(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviarMensaje()
    }
  }

  // Emitir evento de "escribiendo" cuando el usuario escribe
  const handleTyping = (value: string) => {
    setNuevoMensaje(value)
    
    if (socket && value.trim().length > 0) {
      // Emitir que está escribiendo
      socket.emit('typing', {
        proyectoId,
        usuarioId: usuario?.id,
        usuarioNombre: usuario?.nombre || 'Usuario'
      })
      
      // Limpiar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Emitir que dejó de escribir después de 1 segundo sin actividad
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('stop-typing', {
            proyectoId,
            usuarioId: usuario?.id
          })
        }
      }, 1000)
    } else if (socket && value.trim().length === 0) {
      // Si el campo está vacío, emitir que dejó de escribir
      socket.emit('stop-typing', {
        proyectoId,
        usuarioId: usuario?.id
      })
    }
  }

  const handleEditar = async (id: number) => {
    if (!editandoTexto.trim()) return

    try {
      await comentarioService.actualizarComentario(id, editandoTexto.trim())
      toast.success('Mensaje actualizado')
      setEditandoId(null)
      setEditandoTexto("")
      await cargarComentarios()
    } catch (error: any) {
      toast.error('Error al actualizar mensaje', {
        description: error.response?.data?.message || 'No se pudo actualizar el mensaje'
      })
    }
  }

  const handleEliminar = async () => {
    if (!eliminandoId) return

    try {
      await comentarioService.eliminarComentario(eliminandoId)
      toast.success('Mensaje eliminado')
      setEliminandoId(null)
      await cargarComentarios()
    } catch (error: any) {
      toast.error('Error al eliminar mensaje', {
        description: error.response?.data?.message || 'No se pudo eliminar el mensaje'
      })
    }
  }

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return ''
    const date = new Date(fecha)
    const ahora = new Date()
    const diff = ahora.getTime() - date.getTime()
    const minutos = Math.floor(diff / 60000)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    if (minutos < 1) return 'Ahora'
    if (minutos < 60) return `Hace ${minutos} min`
    if (horas < 24) return `Hace ${horas} h`
    if (dias < 7) return `Hace ${dias} d`
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: date.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
    })
  }

  const esMiMensaje = (comentario: Comentario) => {
    return comentario.usuario_id === usuario?.id
  }

  const obtenerNombreUsuario = (comentario: Comentario) => {
    if (comentario.usuario_nombre && comentario.usuario_apellido) {
      return `${comentario.usuario_nombre} ${comentario.usuario_apellido}`
    }
    return comentario.usuario_rol === 'tutor' ? 'Tutor' : 'Estudiante'
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3 border-b shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          {usuario?.rol === 'tutor' 
            ? `Chat con ${estudianteNombre && estudianteApellido ? `${estudianteNombre} ${estudianteApellido}` : 'Estudiante'}`
            : `Chat con ${tutorNombre && tutorApellido ? `${tutorNombre} ${tutorApellido}` : 'Tutor'}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        {/* Área de mensajes */}
        <div className="flex-1 px-4 py-4 overflow-y-auto min-h-0" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No hay mensajes aún. Sé el primero en escribir.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comentarios.map((comentario) => {
                const esNuevo = comentario.id ? mensajesNuevos.has(comentario.id) : false
                return (
                  <div
                    key={comentario.id}
                    className={cn(
                      "flex gap-3",
                      esMiMensaje(comentario) ? "flex-row-reverse" : "flex-row",
                      esNuevo && "message-enter"
                    )}
                  >

                  {/* Avatar */}
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                    esMiMensaje(comentario)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {comentario.usuario_nombre?.[0]?.toUpperCase() || 'U'}
                  </div>

                  {/* Mensaje */}
                  <div className={cn(
                    "flex-1 max-w-[70%]",
                    esMiMensaje(comentario) ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "rounded-lg px-4 py-2",
                      esMiMensaje(comentario)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {editandoId === comentario.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editandoTexto}
                            onChange={(e) => setEditandoTexto(e.target.value)}
                            className="min-h-[60px] bg-background"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditandoId(null)
                                setEditandoTexto("")
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditar(comentario.id!)}
                              disabled={!editandoTexto.trim()}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {comentario.comentario}
                          </p>
                          {comentario.editado === 1 && (
                            <p className="text-xs opacity-70 mt-1">(editado)</p>
                          )}
                        </>
                      )}
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
                      esMiMensaje(comentario) ? "justify-end" : "justify-start"
                    )}>
                      <span>{obtenerNombreUsuario(comentario)}</span>
                      <span>•</span>
                      <span>{formatearFecha(comentario.fecha_comentario)}</span>
                      {esMiMensaje(comentario) && editandoId !== comentario.id && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <SimpleMenu
                            align="end"
                            trigger={
                              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Acciones del mensaje">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            }
                          >
                            <SimpleMenuItem
                              onClick={() => {
                                setEditandoId(comentario.id!)
                                setEditandoTexto(comentario.comentario)
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </SimpleMenuItem>
                            <SimpleMenuSeparator />
                            <SimpleMenuItem
                              onClick={() => setEliminandoId(comentario.id!)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </SimpleMenuItem>
                          </SimpleMenu>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                )
              })}
              
              {/* Indicador de "escribiendo..." */}
              {usuarioEscribiendo && (
                <div className={cn(
                  "flex gap-3 typing-indicator-container",
                  indicadorSaliendo && "exit"
                )}>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium bg-muted text-muted-foreground">
                    {usuarioEscribiendo.nombre[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 max-w-[70%]">
                    <div className="rounded-lg px-4 py-2 bg-muted inline-block">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{usuarioEscribiendo.nombre}</span>
                      <span>está escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input de mensaje */}
        <div className="border-t p-4 shrink-0">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={nuevoMensaje}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              className="min-h-[60px] resize-none"
              disabled={enviando}
            />
            <Button
              onClick={handleEnviarMensaje}
              disabled={!nuevoMensaje.trim() || enviando}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              {enviando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={eliminandoId !== null} onOpenChange={(open) => !open && setEliminandoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEliminandoId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

