"use client"

import * as React from "react"
import {
  IconDashboard,
  IconInnerShadowTop,
  IconSettings,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react"
import { useAuth } from "@/context/AuthContext"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconLogout } from "@tabler/icons-react"
import { useNavigate } from "react-router-dom"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
      action: "dashboard",
    },
    {
      title: "Tutores",
      url: "#gestion-tutores",
      icon: IconUserPlus,
      action: "gestion-tutores",
    },
    {
      title: "Usuarios",
      url: "#gestion-usuarios",
      icon: IconUsers,
      action: "gestion-usuarios",
    },
  ],
  navSecondary: [
    {
      title: "Configuración",
      url: "#",
      icon: IconSettings,
      action: "configuracion",
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onVistaChange?: (vista: string) => void
}

export function AppSidebar({ onVistaChange, ...props }: AppSidebarProps) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const userData = usuario ? {
    name: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario',
    email: usuario.email || 'usuario@example.com',
    avatar: `/avatars/${usuario.id}.jpg`,
  } : {
    name: "Usuario",
    email: "usuario@example.com",
    avatar: "/avatars/default.jpg",
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Sistema de Proyectos</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          onItemClick={(action) => onVistaChange?.(action)}
        />
        <NavSecondary
          items={data.navSecondary}
          className="mt-auto"
          onItemClick={(action) => onVistaChange?.(action)}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <IconLogout className="size-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
