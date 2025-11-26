"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { proyectoService } from "@/services/proyectoService"
import { toast } from "sonner"
import { AppSidebar } from "./components/app-sidebar"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DataTable } from "./components/data-table"
import { SectionCards } from "./components/section-cards"
import { SiteHeader } from "./components/site-header"
import { GestionUsuarios } from "./components/gestion-usuarios/GestionUsuarios"
import { SettingsAdmin } from "./components/SettingsAdmin"
import { GestionTutores } from "./components/gestion-usuarios/GestionTutores"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"


type VistaActiva = 'dashboard' | 'gestion-tutores' | 'gestion-usuarios' | 'configuracion'

export function Dashboard() {
  const { usuario } = useAuth()
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('dashboard')
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true)

  useEffect(() => {
    if (usuario && usuario.rol === 'administrador') {
      cargarEstadisticas()
    }
  }, [usuario])

  const cargarEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true)
      const stats = await proyectoService.obtenerEstadisticas()
      setEstadisticas(stats)
    } catch (error: any) {
      toast.error('Error al cargar estadísticas', {
        description: error.response?.data?.message || 'No se pudieron cargar las estadísticas'
      })
    } finally {
      setLoadingEstadisticas(false)
    }
  }

  const handleVistaChange = (vista: string) => {
    if (
      vista === 'dashboard' ||
      vista === 'gestion-tutores' ||
      vista === 'gestion-usuarios' ||
      vista === 'configuracion'
    ) {
      setVistaActiva(vista as VistaActiva)
    }
  }

  const renderContent = () => {
    switch (vistaActiva) {
      case 'gestion-tutores':
        return (
          <div className="px-4 lg:px-6">
            <GestionTutores />
          </div>
        )
      case 'gestion-usuarios':
        return (
          <div className="px-4 lg:px-6">
            <GestionUsuarios />
          </div>
        )
      case 'configuracion':
        return (
          <div className="px-4 lg:px-6">
            <SettingsAdmin />
          </div>
        )
      default:
        return (
          <>
            <SectionCards estadisticas={estadisticas} loading={loadingEstadisticas} />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable />
          </>
        )
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" onVistaChange={handleVistaChange} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
