"use client"

import * as React from "react"
import {
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Proyecto } from "@/types"

import { NavDocuments } from "./nav-documents"
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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard-usuario",
      icon: IconDashboard,
    },
  ],
  navSecondary: [
    {
      title: "Configuración",
      url: "/dashboard-usuario/settings",
      icon: IconSettings,
    },
    {
      title: "Documentación",
      url: "/dashboard-usuario/documentacion",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ 
  proyectos = [],
  ...props 
}: React.ComponentProps<typeof Sidebar> & { proyectos?: Proyecto[] }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const userData = usuario ? {
    name: usuario.nombre && usuario.apellido 
      ? `${usuario.nombre} ${usuario.apellido}`.trim()
      : usuario.nombre || usuario.apellido || 'Usuario',
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
        <NavMain items={data.navMain} />
        <NavDocuments proyectos={proyectos} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
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
