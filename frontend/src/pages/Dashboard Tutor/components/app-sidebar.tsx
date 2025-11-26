"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react"
import { useAuth } from "@/context/AuthContext"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { NavAccesoRapido } from "./nav-acceso-rapido"
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
      url: "/dashboard-tutor",
      icon: IconDashboard,
      action: "dashboard",
    },
    {
      title: "Estudiantes Tutorizados",
      url: "/tutores/estudiantes",
      icon: IconUsers,
      action: "estudiantes",
    },
  ],
  navSecondary: [
    {
      title: "Configuración",
      url: "/dashboard-tutor/settings",
      icon: IconSettings,
    },
    {
      title: "Ayuda",
      url: "#",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        />
        <NavAccesoRapido />
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
