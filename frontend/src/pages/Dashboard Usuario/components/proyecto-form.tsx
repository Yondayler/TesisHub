"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Proyecto } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ModoFormulario = "crear" | "editar" | "ver"

interface ProyectoFormProps {
  proyecto?: Proyecto
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (proyecto: Partial<Proyecto>) => Promise<void> | void
  mode: ModoFormulario
}

interface ErroresFormulario {
  titulo?: string
  descripcion?: string
  planteamiento?: string
  solucion_problema?: string
}

const obtenerValoresIniciales = (proyecto?: Proyecto): Partial<Proyecto> => ({
  titulo: proyecto?.titulo ?? "",
  descripcion: proyecto?.descripcion ?? "",
  planteamiento: proyecto?.planteamiento ?? "",
  solucion_problema: proyecto?.solucion_problema ?? "",
})

export function ProyectoForm({
  proyecto,
  open,
  onOpenChange,
  onSubmit,
  mode,
}: ProyectoFormProps) {
  const [formData, setFormData] = useState<Partial<Proyecto>>(obtenerValoresIniciales(proyecto))
  const [estaGuardando, setEstaGuardando] = useState(false)
  const [errores, setErrores] = useState<ErroresFormulario>({})

  const esModoLectura = mode === "ver"

  useEffect(() => {
    setFormData(obtenerValoresIniciales(proyecto))
  }, [proyecto, open])

  const tituloDrawer = useMemo(() => {
    if (mode === "editar") return "Editar proyecto"
    if (mode === "ver") return "Detalle del proyecto"
    return "Nuevo proyecto"
  }, [mode])

  const descripcionDrawer = useMemo(() => {
    if (mode === "editar") return "Actualiza la información del proyecto seleccionado."
    if (mode === "ver") return "Consulta la información registrada del proyecto."
    return "Completa la información para registrar un nuevo proyecto."
  }, [mode])

  const etiquetaBoton = mode === "editar" ? "Guardar cambios" : "Crear proyecto"

  const handleChange = (campo: keyof Proyecto, valor: string) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (esModoLectura) {
      onOpenChange(false)
      return
    }

    // Limpiar errores previos
    const nuevosErrores: ErroresFormulario = {}

    const titulo = formData.titulo?.trim() ?? ""
    const descripcion = formData.descripcion?.trim() ?? ""
    const planteamiento = formData.planteamiento?.trim() ?? ""
    const solucion_problema = formData.solucion_problema?.trim() ?? ""

    // Validar título
    if (!titulo) {
      nuevosErrores.titulo = "El título es obligatorio"
    } else if (titulo.length < 5 || titulo.length > 200) {
      nuevosErrores.titulo = "El título debe tener entre 5 y 200 caracteres"
    }

    // Validar descripción
    if (!descripcion) {
      nuevosErrores.descripcion = "La descripción es obligatoria"
    } else if (descripcion.length < 20) {
      nuevosErrores.descripcion = "La descripción debe tener al menos 20 caracteres"
    }

    // Validar planteamiento
    if (!planteamiento) {
      nuevosErrores.planteamiento = "El planteamiento es obligatorio"
    } else if (planteamiento.length < 20) {
      nuevosErrores.planteamiento = "El planteamiento debe tener al menos 20 caracteres"
    }

    // Validar solución propuesta
    if (!solucion_problema) {
      nuevosErrores.solucion_problema = "La solución propuesta es obligatoria"
    } else if (solucion_problema.length < 20) {
      nuevosErrores.solucion_problema = "La solución propuesta debe tener al menos 20 caracteres"
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      const primerError = nuevosErrores.titulo 
        || nuevosErrores.descripcion 
        || nuevosErrores.planteamiento 
        || nuevosErrores.solucion_problema
      if (primerError) {
        toast.error("Revisa los campos del formulario", {
          description: primerError,
        })
      }
      return
    }

    setErrores({})

    setEstaGuardando(true)
    try {
      await onSubmit({
        titulo,
        descripcion,
        planteamiento,
        solucion_problema,
      })
      toast.success(mode === "editar" ? "Proyecto actualizado" : "Proyecto creado")
      onOpenChange(false)
    } catch (error: any) {
      const apiErrors = error?.response?.data?.errors as { field?: string; message: string }[] | undefined

      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const erroresBackend: ErroresFormulario = {}

        apiErrors.forEach((err) => {
          if (!err.field) return
          if (err.field === "titulo") {
            erroresBackend.titulo = err.message
          }
          if (err.field === "descripcion") {
            erroresBackend.descripcion = err.message
          }
          if (err.field === "planteamiento") {
            erroresBackend.planteamiento = err.message
          }
          if (err.field === "solucion_problema") {
            erroresBackend.solucion_problema = err.message
          }
        })

        setErrores((prev) => ({
          ...prev,
          ...erroresBackend,
        }))

        const primerError = erroresBackend.titulo 
          || erroresBackend.descripcion 
          || erroresBackend.planteamiento 
          || erroresBackend.solucion_problema 
          || apiErrors[0]?.message
        toast.error("No se pudo guardar el proyecto", {
          description: primerError ?? "Inténtalo nuevamente.",
        })
      } else {
        toast.error("No se pudo guardar el proyecto", {
          description: error?.response?.data?.message ?? "Inténtalo nuevamente.",
        })
      }
    } finally {
      setEstaGuardando(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader className="space-y-2">
            <DrawerTitle>{tituloDrawer}</DrawerTitle>
            <DrawerDescription>{descripcionDrawer}</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-6 px-6 py-4 overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                aria-invalid={!!errores.titulo}
                value={formData.titulo ?? ""}
                onChange={(event) => {
                  handleChange("titulo", event.target.value)
                  // Limpiar error cuando el usuario empiece a escribir
                  if (errores.titulo) {
                    setErrores(prev => ({ ...prev, titulo: undefined }))
                  }
                }}
                placeholder="Ingresa el título del proyecto"
                disabled={esModoLectura || estaGuardando}
                required
              />
              {errores.titulo && (
                <p className="text-sm text-destructive">
                  {errores.titulo}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                aria-invalid={!!errores.descripcion}
                value={formData.descripcion ?? ""}
                onChange={(event) => {
                  handleChange("descripcion", event.target.value)
                  // Limpiar error cuando el usuario empiece a escribir
                  if (errores.descripcion) {
                    setErrores(prev => ({ ...prev, descripcion: undefined }))
                  }
                }}
                placeholder="Describe brevemente el proyecto"
                disabled={esModoLectura || estaGuardando}
                rows={3}
                required
              />
              {errores.descripcion && (
                <p className="text-sm text-destructive">
                  {errores.descripcion}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="planteamiento">Planteamiento</Label>
              <Textarea
                id="planteamiento"
                aria-invalid={!!errores.planteamiento}
                value={formData.planteamiento ?? ""}
                onChange={(event) => {
                  handleChange("planteamiento", event.target.value)
                  // Limpiar error cuando el usuario empiece a escribir
                  if (errores.planteamiento) {
                    setErrores(prev => ({ ...prev, planteamiento: undefined }))
                  }
                }}
                placeholder="Explica el planteamiento del problema"
                disabled={esModoLectura || estaGuardando}
                rows={4}
                required
              />
              {errores.planteamiento && (
                <p className="text-sm text-destructive">
                  {errores.planteamiento}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="solucion_problema">Solución propuesta</Label>
              <Textarea
                id="solucion_problema"
                aria-invalid={!!errores.solucion_problema}
                value={formData.solucion_problema ?? ""}
                onChange={(event) => {
                  handleChange("solucion_problema", event.target.value)
                  // Limpiar error cuando el usuario empiece a escribir
                  if (errores.solucion_problema) {
                    setErrores(prev => ({ ...prev, solucion_problema: undefined }))
                  }
                }}
                placeholder="Detalla la solución al problema identificado"
                disabled={esModoLectura || estaGuardando}
                rows={4}
                required
              />
              {errores.solucion_problema && (
                <p className="text-sm text-destructive">
                  {errores.solucion_problema}
                </p>
              )}
            </div>
          </div>

          <DrawerFooter className="border-t px-6 py-4">
            {esModoLectura ? (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            ) : (
              <div className="flex w-full items-center gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={estaGuardando}
                >
                  {estaGuardando ? "Guardando..." : etiquetaBoton}
                </Button>
                <DrawerClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={estaGuardando}
                  >
                    Cancelar
                  </Button>
                </DrawerClose>
              </div>
            )}
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}




