"use client"

import * as React from "react"
import { useState } from "react"
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      const errorMessage = error.response?.data?.message || error.message || "Error al crear el tutor"
      
      // Mensaje específico para email duplicado
      if (errorMessage.includes('email') || errorMessage.includes('registrado')) {
        toast.error("El correo electrónico ya está registrado", {
          description: "Por favor, use un correo diferente"
        })
      } else {
        toast.error(errorMessage)
      }
      
      setIsLoading(false)
    }
  }

  // Validaciones en tiempo real
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.')
  const isPasswordValid = formData.password.length >= 8
  const isConfirmPasswordValid = confirmPassword === formData.password && confirmPassword.length > 0
  const isFormValid = formData.nombre && formData.apellido && isEmailValid && isPasswordValid && isConfirmPasswordValid

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
                className={`pl-3 rounded-lg ${isEmailValid ? 'border-green-500' : formData.email && !isEmailValid ? 'border-red-500' : ''}`}
                required
              />
              {formData.email && (
                isEmailValid ? (
                  <IconCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                ) : (
                  <IconX className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                )
              )}
            </div>
            {formData.email && !isEmailValid && (
              <p className="text-xs text-red-500">Ingrese un correo electrónico válido</p>
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
