import { useState, useEffect, useRef } from "react"
import { chatService, MensajeChat } from "@/services/chatService"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, X, Sparkles, ChevronDown, Plus, Square, Menu, Zap, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate, useLocation } from "react-router-dom"
// @ts-ignore
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SidebarChat } from "./SidebarChat"

interface ChatAssistantProps {
  proyectoId?: number;
  className?: string;
}

// Componente para simular escritura
const TypewriterMessage = ({ content, onComplete, onUpdate }: { content: string, onComplete?: () => void, onUpdate?: () => void }) => {
  const [displayLength, setDisplayLength] = useState(0)

  useEffect(() => {
    setDisplayLength(0)
    const intervalId = setInterval(() => {
      setDisplayLength((prev) => {
        if (prev < content.length) {
          onUpdate?.() // Trigger scroll on each character
          return prev + 1
        }
        clearInterval(intervalId)
        onComplete?.()
        return prev
      })
    }, 10) // Velocidad de escritura

    return () => clearInterval(intervalId)
  }, [content])

  // @ts-ignore
  return (
    <div className={cn(
      "prose max-w-none dark:prose-invert text-[16px] leading-relaxed text-gray-200",
      "prose-headings:text-white prose-headings:font-extrabold prose-headings:mt-8 prose-headings:mb-4",
      "prose-h2:text-2xl prose-h3:text-xl",
      "prose-p:text-gray-200 prose-p:leading-7 prose-p:mb-4",
      "prose-strong:text-white prose-strong:font-bold",
      "prose-ul:my-4 prose-ul:pl-6 prose-li:mb-2 prose-li:marker:text-gray-400",
      "prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-white prose-code:font-mono prose-code:text-sm",
      "prose-table:border-collapse prose-table:w-full prose-table:my-6",
      "prose-th:bg-gray-800 prose-th:text-white prose-th:font-bold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-gray-700",
      "prose-td:p-3 prose-td:border prose-td:border-gray-700 prose-td:text-gray-200",
      "prose-tr:even:bg-gray-800/30"
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.slice(0, displayLength)}</ReactMarkdown>
    </div>
  )
}

export function ChatAssistant({ proyectoId, className }: ChatAssistantProps) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false) // Estado para animación de expansión
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [conversacionId, setConversacionId] = useState<number | undefined>(undefined)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modeloSeleccionado, setModeloSeleccionado] = useState<'rapido' | 'razonamiento'>(() => {
    // Cargar preferencia de localStorage
    const saved = localStorage.getItem('chat-modelo-preferido')
    return (saved === 'rapido' || saved === 'razonamiento') ? saved : 'razonamiento'
  })
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<'gemini' | 'groq'>(() => {
    // Cargar preferencia de localStorage
    const saved = localStorage.getItem('llm-provider-preferido')
    return (saved === 'gemini' || saved === 'groq') ? saved : 'groq'
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Estado para archivo adjunto
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    extractedText: string;
  } | null>(null)

  // Función para hacer scroll al fondo
  const scrollToBottom = () => {
    if (scrollRef.current && shouldAutoScroll && !isUserScrollingRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  // Detectar si el usuario hace scroll manual
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current

      // Marcar que el usuario está haciendo scroll
      isUserScrollingRef.current = true

      // Limpiar timeout anterior
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Después de 150ms sin scroll, considerar que terminó de hacer scroll
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false
      }, 150)

      // Si el usuario está cerca del fondo (menos de 150px), reactivar auto-scroll
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 150
      setShouldAutoScroll(isAtBottom)
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Al abrir, cargar sugerencias y activar animación
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para permitir que el DOM se monte antes de animar
      requestAnimationFrame(() => setIsExpanded(true))

      // Cargar historial si no hay mensajes
      if (mensajes.length === 0) {
        cargarHistorial()
      }

      if (sugerencias.length === 0) {
        cargarSugerencias()
      }
    } else {
      setIsExpanded(false)
    }
  }, [isOpen])

  // Verificar si debemos abrir el chat automáticamente (desde navegación)
  useEffect(() => {
    if (location.state && (location.state as any).openChat) {
      setIsOpen(true)
      // Limpiar el state para que no se vuelva a abrir al recargar
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const cargarHistorial = async (id?: number) => {
    try {
      setLoading(true)
      const historial = await chatService.obtenerHistorial(proyectoId, id)
      setMensajes(historial)
    } catch (error) {
      console.error("Error cargando historial", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarConversacion = (id: number) => {
    setConversacionId(id)
    cargarHistorial(id)
  }

  const handleNuevaConversacion = () => {
    setConversacionId(undefined)
    setMensajes([])
    // Opcional: cargar sugerencias nuevamente
  }

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom()
    }
  }, [mensajes, shouldAutoScroll])

  // Bloquear scroll del body y limpiar timeouts
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      // Limpiar timeout de scroll si existe
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [isOpen])

  const cargarSugerencias = async () => {
    try {
      const data = await chatService.obtenerSugerencias(proyectoId)
      setSugerencias(data)
    } catch (error) {
      console.error("Error cargando sugerencias", error)
    }
  }

  const handleStop = () => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setLoading(false)
    } else if (isTyping) {
      setIsTyping(false)
    }
  }

  const handleEnviar = async (texto: string = input) => {
    if (!texto.trim() || loading || isTyping) return

    // Si hay archivo adjunto, agregar su contenido al mensaje
    let mensajeCompleto = texto
    if (attachedFile) {
      if (attachedFile.extractedText) {
        // Si se extrajo texto correctamente, incluirlo en el mensaje
        mensajeCompleto = `${texto}\n\n📎 **Archivo adjunto: "${attachedFile.name}"**\n\n${attachedFile.extractedText}`
      } else {
        // Si no se pudo extraer texto (ej: imagen sin OCR), solo mencionar el archivo
        mensajeCompleto = `${texto}\n\n[Archivo adjunto: ${attachedFile.name} - No se pudo extraer texto]`
      }
    }

    const mensajeUsuario: MensajeChat = {
      role: 'user',
      content: mensajeCompleto,
      timestamp: new Date()
    }

    setMensajes(prev => [...prev, mensajeUsuario])
    setInput("")
    setAttachedFile(null) // Limpiar archivo adjunto
    setLoading(true)

    try {
      const mensajesPrevios = mensajes.map(m => ({
        role: m.role,
        content: m.content
      }))

      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      const respuesta = await chatService.enviarMensaje(
        texto,
        proyectoId,
        mensajesPrevios,
        conversacionId,
        controller.signal,
        modeloSeleccionado,
        proveedorSeleccionado
      )

      // Si es una nueva conversación, guardar el ID y notificar al sidebar
      if (respuesta.conversacionId && !conversacionId) {
        setConversacionId(respuesta.conversacionId)
        // Recargar lista de conversaciones en el sidebar

      }

      abortControllerRef.current = null

      setLoading(false)
      setIsTyping(true)

      const mensajeAsistente: MensajeChat = {
        role: 'assistant',
        content: respuesta.respuesta,
        timestamp: new Date()
      }

      setMensajes(prev => [...prev, mensajeAsistente])

      if (respuesta.referencias && respuesta.referencias.length > 0) {
        const referenciasTexto = "\n\n**Referencias utilizadas:**\n" +
          respuesta.referencias.map(r => `• ${r.titulo} (${r.año})`).join('\n')

        setMensajes(prev => {
          const newMsgs = [...prev]
          const lastMsg = newMsgs[newMsgs.length - 1]
          lastMsg.content += referenciasTexto
          return newMsgs
        })
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'canceled') {
        console.log('Petición cancelada')
        setLoading(false)
        return
      }

      setLoading(false)
      setMensajes(prev => [...prev, {
        role: 'assistant',
        content: "Lo siento, tuve un problema al procesar tu mensaje. Por favor intenta de nuevo.",
        timestamp: new Date()
      }])
    } finally {
      abortControllerRef.current = null
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)

      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append('file', file)

      // Subir archivo al backend y extraer texto
      const response = await chatService.subirArchivo(formData)

      // Guardar archivo en estado para mostrarlo visualmente
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        extractedText: response.extractedText
      })

      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error subiendo archivo:', error)
      setMensajes(prev => [...prev, {
        role: 'assistant',
        content: "Lo siento, hubo un error al subir el archivo. Por favor intenta de nuevo.",
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar archivo adjunto
  const removeAttachment = () => {
    setAttachedFile(null)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-500 z-50 bg-[var(--primary)] text-[var(--primary-foreground)] animate-in zoom-in hover:scale-110",
          className
        )}
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans transition-all duration-500 ease-out origin-bottom-right",
        isExpanded ? "scale-100 opacity-100 rounded-none" : "scale-0 opacity-0 rounded-[2rem] translate-x-[40%] translate-y-[40%]"
      )}
    >
      {/* Header Minimalista */}
      <header className="h-16 flex items-center justify-between px-4 bg-[var(--background)] sticky top-0 z-10 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 cursor-pointer text-[var(--foreground)]" onClick={() => setIsOpen(false)}>
            <span className="text-xl font-medium bg-gradient-to-r from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] bg-clip-text text-transparent">
              Asistente de Tesis
            </span>
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
        </div>

        {/* Toggle de Proveedor + Modelo + Botón Construir */}
        <div className="flex items-center gap-2">
          {/* Toggle de Proveedor LLM */}
          <div className="flex items-center gap-1 bg-[var(--muted)] rounded-full p-1">
            <button
              onClick={() => {
                setProveedorSeleccionado('groq')
                localStorage.setItem('llm-provider-preferido', 'groq')
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                proveedorSeleccionado === 'groq'
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              title="Groq (14,400 requests/día)"
            >
              Groq
            </button>
            <button
              onClick={() => {
                setProveedorSeleccionado('gemini')
                localStorage.setItem('llm-provider-preferido', 'gemini')
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                proveedorSeleccionado === 'gemini'
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              title="Gemini (20 requests/día)"
            >
              Gemini
            </button>
          </div>

          {/* Toggle de Modelo */}
          <div className="flex items-center gap-1 bg-[var(--muted)] rounded-full p-1">
            <button
              onClick={() => {
                setModeloSeleccionado('rapido')
                localStorage.setItem('chat-modelo-preferido', 'rapido')
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                modeloSeleccionado === 'rapido'
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Rápido
            </button>
            <button
              onClick={() => {
                setModeloSeleccionado('razonamiento')
                localStorage.setItem('chat-modelo-preferido', 'razonamiento')
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                modeloSeleccionado === 'razonamiento'
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Brain className="h-3.5 w-3.5" />
              Razonamiento
            </button>
          </div>

          {/* Botón Construir con trazo animado */}
          <div className="relative group isolate">
            {/* Trazo azul oscuro animado - SIEMPRE VISIBLE */}
            <div
              className={cn(
                "absolute -inset-[2px] rounded-full z-0",
                "bg-gradient-to-r from-blue-600 via-blue-800 to-blue-600",
                "bg-[length:200%_100%]",
                "opacity-100 animate-rainbow"
              )}
            />

            {/* Botón */}
            <button
              onClick={() => navigate('/canvas')}
              className={cn(
                "relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium",
                "bg-[var(--background)] text-[var(--foreground)]",
                "transition-all duration-200",
                "hover:shadow-md cursor-pointer"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Construir
            </button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-10 w-10 hover:bg-[var(--muted)] rounded-full text-[var(--muted-foreground)] transition-colors"
        >
          <X className="h-6 w-6" />
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de conversaciones */}
        <div
          className="h-full bg-[var(--background)] border-r border-[var(--border)] z-20 overflow-hidden flex-shrink-0"
          style={{
            width: sidebarOpen ? '256px' : '0px',
            transition: 'width 300ms ease-in-out',
            minWidth: 0
          }}
        >
          <SidebarChat
            proyectoId={proyectoId}
            conversacionActualId={conversacionId}
            onSeleccionarConversacion={handleSeleccionarConversacion}
            onNuevaConversacion={handleNuevaConversacion}
            isOpen={sidebarOpen}
          />
        </div>
        {/* Área de Chat */}
        <main className="flex-1 overflow-hidden flex flex-col relative bg-[var(--background)]">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 md:px-[15%] py-8 space-y-8 w-full scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent"
          >
            {mensajes.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                <div className="space-y-2 text-center">
                  <h3 className="text-5xl font-medium tracking-tight bg-gradient-to-br from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] bg-clip-text text-transparent pb-2">
                    Hola, {usuario?.nombre?.split(' ')[0] || 'Estudiante'}
                  </h3>
                  <p className="text-2xl text-[var(--muted-foreground)] font-light">
                    ¿En qué puedo ayudarte con tu tesis hoy?
                  </p>
                </div>

                {/* Sugerencias estilo Cards */}
                {sugerencias.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-3xl mt-8">
                    {sugerencias.slice(0, 4).map((sug, i) => (
                      <div key={i} className="relative group isolate">
                        {/* Trazo azul oscuro animado - solo en hover */}
                        <div
                          className={cn(
                            "absolute -inset-[2px] rounded-2xl transition-opacity duration-300 z-0",
                            "bg-gradient-to-r from-blue-600 via-blue-800 to-blue-600",
                            "bg-[length:200%_100%]",
                            "opacity-0 group-hover:opacity-100 group-hover:animate-rainbow"
                          )}
                        />

                        {/* Botón de sugerencia */}
                        <button
                          onClick={() => handleEnviar(sug)}
                          className="relative z-10 text-left text-sm p-4 rounded-2xl bg-[var(--secondary)] hover:bg-[var(--muted)] text-[var(--foreground)] transition-all duration-200 h-24 flex flex-col justify-between w-full cursor-pointer"
                        >
                          <span className="relative z-10">{sug}</span>
                          <div className="relative z-10 self-end bg-[var(--background)] p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <Send className="h-3 w-3 text-[var(--foreground)]" />
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mensajes.map((msg, i) => {
              const isAssistant = msg.role === 'assistant'
              const isLast = i === mensajes.length - 1

              return (
                <div
                  key={i}
                  className={cn(
                    "flex w-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                    !isAssistant && "justify-end"
                  )}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--chart-1)] to-[var(--chart-3)] flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-[var(--primary)]/20">
                      <Sparkles className="h-4 w-4 text-white fill-white" />
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[85%] md:max-w-[80%] text-[16px] leading-relaxed",
                    !isAssistant ? "bg-[var(--secondary)] px-5 py-3 rounded-[20px] text-[var(--foreground)]" : "text-[var(--foreground)] px-1"
                  )}>
                    {isAssistant && isLast && isTyping ? (
                      <TypewriterMessage
                        content={msg.content}
                        onComplete={() => setIsTyping(false)}
                        onUpdate={() => shouldAutoScroll && scrollToBottom()}
                      />
                    ) : (
                      <>
                        {/* Renderizar archivo adjunto si existe */}
                        {msg.content.includes('[Archivo adjunto:') && (
                          <div className="mb-3 p-3 bg-[var(--muted)]/50 rounded-xl flex items-center gap-3 border border-[var(--border)]">
                            <div className="flex-shrink-0 w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                                {msg.content.match(/\[Archivo adjunto: (.+?)\]/)?.[1] || 'Archivo'}
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">Documento adjunto</p>
                            </div>
                          </div>
                        )}

                        {/* Renderizar contenido del mensaje (sin el marcador de archivo) */}
                        <div className={cn(
                          "prose max-w-none dark:prose-invert text-[16px] leading-relaxed text-gray-200",
                          "prose-headings:text-white prose-headings:font-extrabold prose-headings:mt-8 prose-headings:mb-4",
                          "prose-h2:text-2xl prose-h3:text-xl",
                          "prose-p:text-gray-200 prose-p:leading-7 prose-p:mb-4",
                          "prose-strong:text-white prose-strong:font-bold",
                          "prose-ul:my-4 prose-ul:pl-6 prose-li:mb-2 prose-li:marker:text-gray-400",
                          "prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-white prose-code:font-mono prose-code:text-sm",
                          "prose-table:border-collapse prose-table:w-full prose-table:my-6",
                          "prose-th:bg-gray-800 prose-th:text-white prose-th:font-bold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-gray-700",
                          "prose-td:p-3 prose-td:border prose-td:border-gray-700 prose-td:text-gray-200",
                          "prose-tr:even:bg-gray-800/30"
                        )}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.replace(/\[Archivo adjunto:.+?\]\n*/g, '')}</ReactMarkdown>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-start gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--chart-1)] to-[var(--chart-3)] flex items-center justify-center shrink-0 opacity-70">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1 h-8">
                  <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[var(--muted-foreground)] rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area Flotante */}
          <footer className="p-4 md:p-6 bg-[var(--background)]">
            <div className="max-w-3xl mx-auto relative">
              {/* Contenedor con animación de arcoíris */}
              <div className="relative">
                {/* Borde animado de arcoíris - Espectro completo */}
                <div
                  className={cn(
                    "absolute -inset-[2px] rounded-[34px] transition-opacity duration-500",
                    "bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 to-red-500",
                    "bg-[length:200%_100%]",
                    (loading || isTyping) ? "opacity-100 animate-rainbow" : "opacity-0"
                  )}
                />

                {/* Archivo adjunto - Mostrar si existe */}
                {attachedFile && (
                  <div className="mb-3 p-3 bg-[var(--muted)] rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
                    <div className="flex-shrink-0 w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{attachedFile?.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {((attachedFile?.size || 0) / 1024).toFixed(1)} KB
                        {attachedFile?.extractedText && !attachedFile.extractedText.includes('[') &&
                          <span className="ml-2">• Texto extraído</span>
                        }
                      </p>
                    </div>
                    <button
                      onClick={removeAttachment}
                      className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-[var(--destructive)]/10 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--destructive)]" />
                    </button>
                  </div>
                )}

                {/* Input container */}
                <div className={cn(
                  "relative bg-[var(--muted)] rounded-[32px] flex items-center pl-2 pr-4 py-2 focus-within:bg-[var(--secondary)] transition-colors duration-200 ring-1 ring-transparent focus-within:ring-[var(--border)]"
                )}>
                  <div className="flex items-center gap-1 px-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFileUpload}
                      className="h-9 w-9 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={onFileChange}
                    />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleEnviar()
                    }}
                    className="flex-1 flex items-center gap-4"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={loading ? "IA pensando..." : isTyping ? "Escribiendo respuesta..." : "Pregunta a tu Asistente de Tesis"}
                      disabled={loading || isTyping}
                      className="border-0 bg-transparent focus-visible:ring-0 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] h-12 text-base px-3 shadow-none disabled:opacity-100"
                    />

                    <div className="relative h-10 w-10">
                      <Button
                        type="submit"
                        size="icon"
                        disabled={loading || isTyping || !input.trim()}
                        className={cn(
                          "absolute inset-0 h-10 w-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-all duration-300 transform",
                          (loading || isTyping) ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"
                        )}
                      >
                        <Send className="h-5 w-5 ml-0.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        onClick={handleStop}
                        className={cn(
                          "absolute inset-0 h-10 w-10 rounded-full bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 transition-all duration-300 transform",
                          (loading || isTyping) ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90"
                        )}
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              <p className="text-center text-[11px] text-[var(--muted-foreground)] mt-3">
                El asistente puede cometer errores. Revisa la información importante.
              </p>
            </div>
          </footer>
        </main >
      </div >
    </div >
  )
}
