"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { archivoService } from "@/services/archivoService"
import { ArchivoProyecto } from "@/types"
import { IconDownload, IconTrash, IconFile, IconFileTypePdf, IconFileTypeDoc, IconPhoto } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface FileListProps {
  proyectoId: number
  onArchivoEliminado?: () => void
  refreshTrigger?: number
}

export function FileList({ proyectoId, onArchivoEliminado, refreshTrigger }: FileListProps) {
  const [archivos, setArchivos] = useState<ArchivoProyecto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  useEffect(() => {
    cargarArchivos()
  }, [proyectoId, refreshTrigger])

  const cargarArchivos = async () => {
    try {
      setIsLoading(true)
      const data = await archivoService.obtenerArchivosPorProyecto(proyectoId)
      setArchivos(data)
    } catch (error: any) {
      console.error("Error al cargar archivos:", error)
      toast.error("Error al cargar archivos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDescargar = async (archivo: ArchivoProyecto) => {
    try {
      await archivoService.descargarArchivo(archivo.id!)
      toast.success("Descarga iniciada")
    } catch (error: any) {
      console.error("Error al descargar archivo:", error)
      toast.error("Error al descargar archivo", {
        description: error.response?.data?.message || "No se pudo descargar el archivo"
      })
    }
  }

  const handleEliminar = async (archivo: ArchivoProyecto) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${archivo.nombre_original}"?`)) {
      return
    }

    try {
      setEliminandoId(archivo.id!)
      await archivoService.eliminarArchivo(archivo.id!)
      toast.success("Archivo eliminado exitosamente")
      await cargarArchivos()
      onArchivoEliminado?.()
    } catch (error: any) {
      console.error("Error al eliminar archivo:", error)
      toast.error("Error al eliminar archivo", {
        description: error.response?.data?.message || "No se pudo eliminar el archivo"
      })
    } finally {
      setEliminandoId(null)
    }
  }

  const getFileIcon = (tipo: string) => {
    switch (tipo) {
      case 'documento':
        return <IconFileTypeDoc className="h-5 w-5 text-blue-500" />
      case 'imagen':
        return <IconPhoto className="h-5 w-5 text-green-500" />
      case 'presentacion':
        return <IconFileTypePdf className="h-5 w-5 text-red-500" />
      default:
        return <IconFile className="h-5 w-5 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatFecha = (fecha?: string) => {
    if (!fecha) return "Fecha desconocida"
    try {
      return formatDistanceToNow(new Date(fecha), {
        addSuffix: true,
        locale: es
      })
    } catch {
      return "Fecha desconocida"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (archivos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <IconFile className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay archivos subidos para este proyecto</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {archivos.map((archivo) => (
        <div
          key={archivo.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(archivo.tipo_archivo)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{archivo.nombre_original}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(archivo.tamaño_bytes)}</span>
                <span>•</span>
                <span>v{archivo.version}</span>
                <span>•</span>
                <span>{formatFecha(archivo.fecha_subida)}</span>
              </div>
              {archivo.descripcion && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {archivo.descripcion}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDescargar(archivo)}
              title="Descargar"
            >
              <IconDownload className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEliminar(archivo)}
              disabled={eliminandoId === archivo.id}
              className="text-destructive hover:text-destructive"
              title="Eliminar"
            >
              {eliminandoId === archivo.id ? (
                <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
              ) : (
                <IconTrash className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

