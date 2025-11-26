import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { usuarioService, CrearTutorData } from "@/services/usuarioService"
import { Usuario } from "@/types"
import { IconUser, IconMail, IconPlus, IconCheck, IconX } from "@tabler/icons-react"

interface CrearTutorProps {
  onTutorCreado?: (tutor: Usuario) => void
  trigger?: React.ReactNode
}

export function CrearTutor({ onTutorCreado, trigger }: CrearTutorProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CrearTutorData>({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [verificandoEmail, setVerificandoEmail] = useState(false)
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Validaciones en tiempo real (definidas antes del useEffect)
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.')

  // Validar email en tiempo real con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current)
    }

    // Si el email está vacío o no es válido, no verificar
    if (!formData.email || !isEmailValid) {
      setEmailError(null)
      setVerificandoEmail(false)
      return
    }

    // Esperar 500ms después de que el usuario deje de escribir
    setVerificandoEmail(true)
    emailTimeoutRef.current = setTimeout(async () => {
      try {
        const emailExiste = await usuarioService.verificarEmail(formData.email)
        if (emailExiste) {
          setEmailError("Este correo electrónico ya está registrado")
        } else {
          setEmailError(null)
        }
      } catch (error: any) {
        // En caso de error, no bloquear al usuario
        console.error("Error al verificar email:", error)
        setEmailError(null)
      } finally {
        setVerificandoEmail(false)
      }
    }, 500)

    // Cleanup
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current)
      }
    }
  }, [formData.email, isEmailValid])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error de email cuando el usuario empiece a escribir
    if (name === 'email') {
      setEmailError(null)
      setVerificandoEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.email || !formData.password || !formData.nombre || !formData.apellido) {
      toast.error("Todos los campos son obligatorios")
      return
    }

    if (formData.password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    // Verificar que el email no tenga error antes de enviar
    if (emailError) {
      toast.error("El correo electrónico ya está registrado", {
        description: "Por favor, use un correo electrónico diferente"
      })
      return
    }

    // Si aún se está verificando el email, esperar un momento
    if (verificandoEmail) {
      toast.info("Verificando disponibilidad del email...", {
        description: "Por favor, espere un momento"
      })
      return
    }

    // Verificar una última vez antes de enviar
    if (isEmailValid) {
      try {
        const emailExiste = await usuarioService.verificarEmail(formData.email)
        if (emailExiste) {
          setEmailError("Este correo electrónico ya está registrado")
          toast.error("El correo electrónico ya está registrado", {
            description: "Por favor, use un correo electrónico diferente"
          })
          return
        }
      } catch (error: any) {
        console.error("Error al verificar email:", error)
        // Continuar con el proceso si hay error en la verificación
      }
    }

    setIsLoading(true)

    try {
      const tutor = await usuarioService.crearTutor(formData)

      // Mostrar animación de éxito
      setShowSuccess(true)
      
      // Esperar para mostrar la animación completa antes de cerrar
      setTimeout(() => {
        // Limpiar formulario
        setFormData({
          email: "",
          password: "",
          nombre: "",
          apellido: "",
        })
        setConfirmPassword("")
        setShowSuccess(false)

        // Cerrar modal
        setOpen(false)

        // Notificar al componente padre
        onTutorCreado?.(tutor)
      }, 2000)

    } catch (error: any) {
      console.error("Error al crear tutor:", error)
      
      // Extraer el mensaje de error del backend
      let errorMessage = "Error al crear el tutor"
      let errorDescription = "Por favor, intente nuevamente"
      
      if (error.response?.data) {
        // Error del backend con estructura ApiResponse
        errorMessage = error.response.data.message || error.response.data.error || errorMessage
      } else if (error.message) {
        // Error directo del mensaje
        errorMessage = error.message
      }
      
      // Mensajes específicos según el tipo de error
      if (errorMessage.toLowerCase().includes('email') || 
          errorMessage.toLowerCase().includes('registrado') ||
          errorMessage.toLowerCase().includes('ya está')) {
        errorMessage = "El correo electrónico ya está registrado"
        errorDescription = "Por favor, use un correo electrónico diferente"
        // Establecer error específico en el campo de email
        setEmailError("Este correo electrónico ya está en uso")
      } else if (errorMessage.toLowerCase().includes('contraseña') || 
                 errorMessage.toLowerCase().includes('password')) {
        errorMessage = "Error en la contraseña"
        errorDescription = errorMessage
      } else if (errorMessage.toLowerCase().includes('requerido') || 
                 errorMessage.toLowerCase().includes('faltan')) {
        errorMessage = "Campos requeridos faltantes"
        errorDescription = "Por favor, complete todos los campos obligatorios"
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000
      })
      
      setIsLoading(false)
    }
  }

  // Validaciones en tiempo real (resto)
  const isPasswordValid = formData.password.length >= 8
  const isConfirmPasswordValid = confirmPassword === formData.password && confirmPassword.length > 0
  // El formulario es válido solo si no hay error de email y todas las validaciones pasan
  const isFormValid = formData.nombre && formData.apellido && isEmailValid && !emailError && isPasswordValid && isConfirmPasswordValid && !verificandoEmail

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Limpiar formulario cuando se cierra el modal
      setFormData({
        email: "",
        password: "",
        nombre: "",
        apellido: "",
      })
      setConfirmPassword("")
      setShowSuccess(false)
      setEmailError(null)
    }
  }

  // Si se muestra el éxito, mostrar solo la animación
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center w-full px-6 py-8">
            <div className="success-checkmark">
              <div className="check-icon">
                <div className="icon-circle"></div>
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
              </div>
            </div>
            <p className="mt-6 text-lg font-medium text-green-600 animate-auth-fade-in animate-auth-delay-200">
              ¡Tutor creado exitosamente!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2" size="lg">
            <IconPlus className="h-5 w-5" />
            Nuevo Tutor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <IconUser className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-2xl font-bold">Crear tutor</DialogTitle>
            <DialogDescription>
              Complete la información para registrar un nuevo tutor en el sistema
            </DialogDescription>
          </div>
        </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Información Personal */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <IconUser className="w-4 h-4" />
            Información Personal
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium">
                Nombre
              </Label>
              <div className="relative">
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Ingrese el nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`pl-3 rounded-lg ${formData.nombre ? 'border-green-500' : ''}`}
                  required
                />
                {formData.nombre && (
                  <IconCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido" className="text-sm font-medium">
                Apellido
              </Label>
              <div className="relative">
                <Input
                  id="apellido"
                  name="apellido"
                  type="text"
                  placeholder="Ingrese el apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`pl-3 rounded-lg ${formData.apellido ? 'border-green-500' : ''}`}
                  required
                />
                {formData.apellido && (
                  <IconCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información de Cuenta */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <IconMail className="w-4 h-4" />
            Información de Cuenta
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo Electrónico
            </Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tutor@universidad.edu"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`pl-3 rounded-lg ${
                  emailError 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : verificandoEmail
                      ? 'border-yellow-500'
                      : isEmailValid && !emailError
                        ? 'border-green-500' 
                        : formData.email && !isEmailValid 
                          ? 'border-red-500' 
                          : ''
                }`}
                required
              />
              {formData.email && (
                verificandoEmail ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  </div>
                ) : emailError ? (
                  <IconX className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                ) : isEmailValid && !emailError ? (
                  <IconCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                ) : formData.email && !isEmailValid ? (
                  <IconX className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                ) : null
              )}
            </div>
            {verificandoEmail && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Verificando disponibilidad del email...</p>
            )}
            {emailError && (
              <p className="text-xs text-red-500 font-medium">{emailError}</p>
            )}
            {formData.email && !isEmailValid && !emailError && !verificandoEmail && (
              <p className="text-xs text-red-500">Ingrese un correo electrónico válido</p>
            )}
            {formData.email && isEmailValid && !emailError && !verificandoEmail && (
              <p className="text-xs text-green-600 dark:text-green-400">✓ Email disponible</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`pl-3 rounded-lg ${isPasswordValid ? 'border-green-500' : formData.password && !isPasswordValid ? 'border-red-500' : ''}`}
                  required
                />
                {formData.password && (
                  isPasswordValid ? (
                    <IconCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  ) : (
                    <IconX className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                  )
                )}
              </div>
              {formData.password && !isPasswordValid && (
                <p className="text-xs text-red-500">La contraseña debe tener al menos 8 caracteres</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repita la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-3 rounded-lg ${isConfirmPasswordValid ? 'border-green-500' : confirmPassword && !isConfirmPasswordValid ? 'border-red-500' : ''}`}
                  required
                />
                {confirmPassword && (
                  isConfirmPasswordValid ? (
                    <IconCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  ) : (
                    <IconX className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                  )
                )}
              </div>
              {confirmPassword && !isConfirmPasswordValid && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                email: "",
                password: "",
                nombre: "",
                apellido: "",
              })
              setConfirmPassword("")
            }}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Limpiar
          </Button>

          <div className="flex-1 sm:ml-auto sm:flex-none">
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <IconUser className="w-4 h-4 mr-2" />
                  Crear Tutor
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
    </Dialog>
  )
}
