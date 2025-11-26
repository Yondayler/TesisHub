"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { proyectoService } from "@/services/proyectoService"
import { usuarioService } from "@/services/usuarioService"
import { Proyecto, Usuario } from "@/types"
import { IconUser, IconUserMinus, IconUserPlus, IconChevronDown } from "@tabler/icons-react"

interface AsignarTutorProps {
  proyecto: Proyecto
  onProyectoActualizado: (proyecto: Proyecto) => void
}

interface DropdownTutoresProps {
  tutores: Usuario[]
  tutorSeleccionado: string
  onChange: (valor: string) => void
}

function DropdownTutores({
  tutores,
  tutorSeleccionado,
  onChange,
}: DropdownTutoresProps) {
  const [abierto, setAbierto] = useState<boolean>(false)
  const contenedorRef = React.useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target as Node)
      ) {
        setAbierto(false)
      }
    }

    if (abierto) {
      document.addEventListener("mousedown", handleClickFuera)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickFuera)
    }
  }, [abierto])

  const tutorActual = tutorSeleccionado
    ? tutores.find((tutor) => tutor.id?.toString() === tutorSeleccionado)
    : undefined

  const etiqueta =
    tutorActual != null
      ? `${tutorActual.nombre} ${tutorActual.apellido}`
      : "Selecciona un tutor"

  return (
    <div ref={contenedorRef} className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setAbierto((prev) => !prev)}
      >
        <span className="truncate">{etiqueta}</span>
        <IconChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {abierto && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
          {tutores.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No hay tutores disponibles
            </div>
          ) : (
            tutores.map((tutor) => (
              <button
                key={tutor.id}
                type="button"
                className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  if (tutor.id) {
                    onChange(tutor.id.toString())
                  }
                  setAbierto(false)
                }}
              >
                {tutor.nombre} {tutor.apellido}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function AsignarTutor({ proyecto, onProyectoActualizado }: AsignarTutorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tutores, setTutores] = useState<Usuario[]>([])
  const [tutorSeleccionado, setTutorSeleccionado] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      cargarTutores()
    }
  }, [isOpen])

  const cargarTutores = async () => {
    try {
      const data = await usuarioService.obtenerTutores()
      setTutores(data)
    } catch (error: any) {
      console.error("Error al cargar tutores:", error)
      toast.error("Error al cargar la lista de tutores")
    }
  }

  const handleAsignarTutor = async () => {
    if (!tutorSeleccionado || tutorSeleccionado === "") {
      toast.error("Debes seleccionar un tutor")
      return
    }

    const tutorId = parseInt(tutorSeleccionado)
    if (isNaN(tutorId)) {
      toast.error("ID de tutor inválido")
      return
    }

    setIsLoading(true)
    try {
      const proyectoActualizado = await proyectoService.asignarTutor(
        proyecto.id!,
        tutorId
      )

      toast.success("Tutor asignado exitosamente")
      onProyectoActualizado(proyectoActualizado)
      setIsOpen(false)
      setTutorSeleccionado("")
    } catch (error: any) {
      console.error("Error al asignar tutor:", error)
      toast.error(error.response?.data?.message || error.message || "Error al asignar tutor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoverTutor = async () => {
    if (!proyecto.tutor_id) return

    setIsLoading(true)
    try {
      const proyectoActualizado = await proyectoService.removerTutor(proyecto.id!)

      toast.success("Tutor removido exitosamente")
      onProyectoActualizado(proyectoActualizado)
    } catch (error: any) {
      console.error("Error al remover tutor:", error)
      toast.error(error.response?.data?.message || "Error al remover tutor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {proyecto.tutor_id ? (
        // Mostrar tutor asignado con opción de cambiar
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 flex-shrink-0">
            <IconUser className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{proyecto.tutor_nombre} {proyecto.tutor_apellido}</span>
          </Badge>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5 flex-shrink-0">
                <IconUserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cambiar</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar Tutor</DialogTitle>
                <DialogDescription>
                  Selecciona un nuevo tutor para el proyecto "{proyecto.titulo}"
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tutor actual:</label>
                  <p className="text-sm text-muted-foreground">
                    {proyecto.tutor_nombre} {proyecto.tutor_apellido}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Nuevo tutor:</label>
                  <DropdownTutores
                    tutores={tutores}
                    tutorSeleccionado={tutorSeleccionado}
                    onChange={setTutorSeleccionado}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAsignarTutor} disabled={isLoading}>
                  {isLoading ? "Asignando..." : "Asignar Tutor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoverTutor}
            disabled={isLoading}
            className="text-destructive hover:text-destructive/90 flex items-center gap-1.5 flex-shrink-0"
          >
            <IconUserMinus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Remover</span>
          </Button>
        </div>
      ) : (
        // No hay tutor asignado, mostrar botón para asignar
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <IconUserPlus className="h-4 w-4 mr-1" />
              Asignar Tutor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Tutor</DialogTitle>
              <DialogDescription>
                Selecciona un tutor para el proyecto "{proyecto.titulo}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Tutor:</label>
                <DropdownTutores
                  tutores={tutores}
                  tutorSeleccionado={tutorSeleccionado}
                  onChange={setTutorSeleccionado}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAsignarTutor} disabled={isLoading}>
                {isLoading ? "Asignando..." : "Asignar Tutor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}




