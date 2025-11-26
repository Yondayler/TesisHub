"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { usuarioService } from "@/services/usuarioService"
import { Usuario } from "@/types"
import { IconEye, IconUser } from "@tabler/icons-react"

interface ListaEstudiantesProps {
  onEstudianteSeleccionado?: (estudiante: Usuario) => void
}

export function ListaEstudiantes({ onEstudianteSeleccionado }: ListaEstudiantesProps) {
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    cargarEstudiantes()
  }, [])

  const cargarEstudiantes = async () => {
    try {
      setIsLoading(true)
      const data = await usuarioService.obtenerEstudiantes()
      setEstudiantes(data)
    } catch (error: any) {
      console.error("Error al cargar estudiantes:", error)
      toast.error("Error al cargar la lista de estudiantes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerProyectos = (estudiante: Usuario) => {
    onEstudianteSeleccionado?.(estudiante)
  }

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "N/A"
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            Lista de Estudiantes
          </h3>
          <p className="text-sm text-muted-foreground">
            {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} registrado{estudiantes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {estudiantes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <IconUser className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No hay estudiantes registrados</h3>
          <p>Los estudiantes aparecerán aquí cuando se registren en el sistema</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudiantes.map((estudiante) => (
                  <TableRow key={estudiante.id}>
                    <TableCell className="font-medium">
                      {estudiante.nombre} {estudiante.apellido}
                    </TableCell>
                    <TableCell>{estudiante.email}</TableCell>
                    <TableCell>
                      {estudiante.cedula || (
                        <span className="text-muted-foreground">No especificada</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {estudiante.telefono || (
                        <span className="text-muted-foreground">No especificado</span>
                      )}
                    </TableCell>
                    <TableCell>{formatFecha(estudiante.fecha_registro)}</TableCell>
                    <TableCell>
                      {estudiante.ultimo_acceso ? formatFecha(estudiante.ultimo_acceso) : (
                        <span className="text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerProyectos(estudiante)}
                        className="flex items-center gap-2"
                      >
                        <IconEye className="h-4 w-4" />
                        Ver Proyectos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
