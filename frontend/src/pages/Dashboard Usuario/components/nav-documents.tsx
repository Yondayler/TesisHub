"use client"

import { useNavigate } from "react-router-dom"
import { IconFolder } from "@tabler/icons-react"
import { Proyecto } from "@/types"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function NavDocuments({
  proyectos,
}: {
  proyectos: Proyecto[]
}) {
  const navigate = useNavigate()

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'rechazado':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'en_revision':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'enviado':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'corregir':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return 'Aprobado'
      case 'rechazado':
        return 'Rechazado'
      case 'en_revision':
        return 'En Revisión'
      case 'enviado':
        return 'Enviado'
      case 'corregir':
        return 'Corregir'
      case 'borrador':
        return 'Borrador'
      default:
        return estado
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Proyectos</SidebarGroupLabel>
      <SidebarMenu>
        {proyectos.length === 0 ? (
          <SidebarMenuItem>
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No hay proyectos
            </div>
          </SidebarMenuItem>
        ) : (
          proyectos.map((proyecto) => (
            <SidebarMenuItem key={proyecto.id}>
              <SidebarMenuButton
                asChild
                onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                className="w-full justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full min-w-0 cursor-pointer">
                  <IconFolder className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{proyecto.titulo || 'Sin título'}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-1.5 py-0.5 flex-shrink-0",
                      getEstadoColor(proyecto.estado)
                    )}
                  >
                    {getEstadoLabel(proyecto.estado)}
                  </Badge>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
