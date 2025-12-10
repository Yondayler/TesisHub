"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { archivoService } from "@/services/archivoService"
import { ArchivoProyecto } from "@/types"
import { IconUpload, IconFile, IconX } from "@tabler/icons-react"

interface FileUploadProps {
  proyectoId: number
  onArchivoSubido?: (archivo: ArchivoProyecto) => void
}

export function FileUpload({ proyectoId, onArchivoSubido }: FileUploadProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido", {
        description: "Solo se permiten PDF, Word, imágenes y presentaciones"
      })
      return
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo demasiado grande", {
        description: "El tamaño máximo permitido es 10MB"
      })
      return
    }

    setArchivo(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!archivo) {
      toast.error("Selecciona un archivo")
      return
    }

    setIsUploading(true)

    try {
      const archivoSubido = await archivoService.subirArchivo(
        proyectoId,
        archivo,
        descripcion || undefined
      )

      toast.success("Archivo subido exitosamente")
      setArchivo(null)
      setDescripcion("")
      onArchivoSubido?.(archivoSubido)
    } catch (error: any) {
      console.error("Error al subir archivo:", error)
      toast.error("Error al subir archivo", {
        description: error.response?.data?.message || "No se pudo subir el archivo"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <IconUpload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <Label htmlFor="archivo" className="cursor-pointer">
              <span className="text-primary hover:underline">
                Haz clic para seleccionar
              </span>{" "}
              o arrastra y suelta
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, Word, imágenes o presentaciones (máx. 10MB)
            </p>
          </div>
          <Input
            id="archivo"
            type="file"
            onChange={handleFileInput}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.ppt,.pptx"
            disabled={isUploading}
          />
        </div>
      </div>

      {archivo && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <IconFile className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{archivo.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(archivo.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setArchivo(null)}
            disabled={isUploading}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe el contenido del archivo..."
          rows={2}
          disabled={isUploading}
        />
      </div>

      <Button type="submit" disabled={!archivo || isUploading} className="w-full">
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Subiendo...
          </>
        ) : (
          <>
            <IconUpload className="h-4 w-4 mr-2" />
            Subir Archivo
          </>
        )}
      </Button>
    </form>
  )
}







