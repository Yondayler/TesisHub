import { useState, FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { registro } = useAuth()
  const navigate = useNavigate()

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return "El correo electrónico es requerido"
        if (!value.includes('@') || !value.includes('.')) {
          return "El formato del correo electrónico no es válido"
        }
        return ""
      case 'password':
        if (!value) return "La contraseña es requerida"
        if (value.length < 8) {
          return "La contraseña debe tener al menos 8 caracteres"
        }
        return ""
      case 'confirmPassword':
        if (!value) return "Confirma tu contraseña"
        if (value !== formData.password) {
          return "Las contraseñas no coinciden"
        }
        return ""
      case 'nombre':
        if (!value) return "El nombre es requerido"
        if (value.length < 2) {
          return "El nombre debe tener al menos 2 caracteres"
        }
        return ""
      case 'apellido':
        if (!value) return "El apellido es requerido"
        if (value.length < 2) {
          return "El apellido debe tener al menos 2 caracteres"
        }
        return ""
      default:
        return ""
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Validar en tiempo real
    if (name === 'confirmPassword' && formData.password) {
      const error = validateField(name, value)
      setFieldErrors(prev => ({ ...prev, [name]: error }))
    } else {
      const error = validateField(name, value)
      if (error) {
        setFieldErrors(prev => ({ ...prev, [name]: error }))
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[name]
          return newErrors
        })
      }
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})

    // Validar todos los campos
    const errors: Record<string, string> = {}
    errors.email = validateField('email', formData.email)
    errors.password = validateField('password', formData.password)
    errors.confirmPassword = validateField('confirmPassword', formData.confirmPassword)
    errors.nombre = validateField('nombre', formData.nombre)
    errors.apellido = validateField('apellido', formData.apellido)

    setFieldErrors(errors)

    // Verificar si hay errores
    const hasErrors = Object.values(errors).some(error => error !== "")
    if (hasErrors) {
      const firstError = Object.values(errors).find(error => error !== "")
      toast.error("Error de validación", {
        description: firstError || "Por favor, completa todos los campos correctamente",
      })
      return
    }

    setLoading(true)

    try {
      // Remover confirmPassword antes de enviar
      const { confirmPassword, ...dataToSend } = formData
      await registro(dataToSend)
      
      toast.success("¡Cuenta creada!", {
        description: "Te has registrado exitosamente",
      })
      
      // Redirigir al dashboard después del registro
      setTimeout(() => {
        navigate("/dashboard-usuario")
      }, 1000)
    } catch (err: any) {
      // Asegurarse de que el mensaje de error sea siempre un string
      let errorMessage = "Error al registrar usuario";
      
      if (err?.message) {
        errorMessage = typeof err.message === 'string' ? err.message : String(err.message);
      } else if (err?.response?.data) {
        // Si el error viene de axios, intentar extraer el mensaje
        const errorData = err.response.data;
        if (typeof errorData.error === 'object' && errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = String(err || "Error al registrar usuario");
      }
      
      setLoading(false)
      
      // Mensajes específicos según el tipo de error
      if (errorMessage.includes('correo') || errorMessage.includes('email') || errorMessage.includes('registrado')) {
        setFieldErrors(prev => ({ ...prev, email: errorMessage }))
        toast.error("Correo electrónico ya registrado", {
          description: errorMessage,
        })
      } else if (errorMessage.includes('contraseña') || errorMessage.includes('password')) {
        setFieldErrors(prev => ({ ...prev, password: errorMessage }))
        toast.error("Error en la contraseña", {
          description: errorMessage,
        })
      } else if (errorMessage.includes('formato') || errorMessage.includes('válido')) {
        if (errorMessage.includes('correo') || errorMessage.includes('email')) {
          setFieldErrors(prev => ({ ...prev, email: errorMessage }))
        }
        toast.error("Error de validación", {
          description: errorMessage,
        })
      } else {
        toast.error("Error al registrar", {
          description: errorMessage,
        })
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold animate-slide-in">Crea tu cuenta</h1>
                <p className="text-muted-foreground text-sm text-balance animate-slide-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                  Completa el formulario para crear tu cuenta
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                <Field>
                  <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={handleChange}
                      onBlur={() => {
                        const error = validateField('nombre', formData.nombre)
                        setFieldErrors(prev => ({ ...prev, nombre: error }))
                      }}
                      required
                      disabled={loading}
                      className={`pl-10 ${fieldErrors.nombre ? 'border-destructive focus:border-destructive' : ''}`}
                    />
                  </div>
                  {fieldErrors.nombre && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.nombre}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Pérez"
                      value={formData.apellido}
                      onChange={handleChange}
                      onBlur={() => {
                        const error = validateField('apellido', formData.apellido)
                        setFieldErrors(prev => ({ ...prev, apellido: error }))
                      }}
                      required
                      disabled={loading}
                      className={`pl-10 ${fieldErrors.apellido ? 'border-destructive focus:border-destructive' : ''}`}
                    />
                  </div>
                  {fieldErrors.apellido && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.apellido}</p>
                  )}
                </Field>
              </div>

              <Field className="animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => {
                      const error = validateField('email', formData.email)
                      setFieldErrors(prev => ({ ...prev, email: error }))
                    }}
                    required
                    disabled={loading}
                    className={`pl-10 ${fieldErrors.email ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                </div>
                <FieldDescription>
                  Usaremos esto para contactarte. No compartiremos tu correo con nadie más.
                </FieldDescription>
                {fieldErrors.email && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                )}
              </Field>

              <Field className="animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => {
                          const error = validateField('password', formData.password)
                          setFieldErrors(prev => ({ ...prev, password: error }))
                        }}
                        required
                        disabled={loading}
                        className={`pl-10 pr-10 ${fieldErrors.password ? 'border-destructive focus:border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirmar Contraseña
                    </FieldLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => {
                          const error = validateField('confirmPassword', formData.confirmPassword)
                          setFieldErrors(prev => ({ ...prev, confirmPassword: error }))
                        }}
                        required
                        disabled={loading}
                        className={`pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-destructive focus:border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </Field>
                </div>
                <FieldDescription>
                  Debe tener al menos 8 caracteres.
                </FieldDescription>
              </Field>

              <Field className="animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </div>
                  ) : (
                    "Crear Cuenta"
                  )}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
                O continúa con
              </FieldSeparator>

              <Field className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
                <Button variant="outline" type="button" disabled title="Próximamente disponible">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Registrarse con Apple</span>
                </Button>
                <Button variant="outline" type="button" disabled title="Próximamente disponible">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Registrarse con Google</span>
                </Button>
                <Button variant="outline" type="button" disabled title="Próximamente disponible">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Registrarse con Meta</span>
                </Button>
              </Field>

              <FieldDescription className="text-center animate-fade-in" style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}>
                ¿Ya tienes una cuenta?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center space-y-6 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
                <h2 className="text-2xl font-bold">Sistema de Aceptación de Proyectos</h2>
                <img 
                  src="/7.png" 
                  alt="TesisHub Logo" 
                  className="h-32 w-32 mx-auto object-contain animate-slide-in"
                  style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
                />
                <p className="text-muted-foreground text-sm">
                  Únete a nuestra plataforma y gestiona tus proyectos de tesis de manera eficiente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Al hacer clic en continuar, aceptas nuestros{" "}
        <a href="#" className="underline-offset-2 hover:underline">
          Términos de Servicio
        </a>{" "}
        y{" "}
        <a href="#" className="underline-offset-2 hover:underline">
          Política de Privacidad
        </a>
        .
      </FieldDescription>
    </div>
  )
}
