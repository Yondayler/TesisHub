"use client"

import { useNavigate } from "react-router-dom"
import { type Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onItemClick,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    action?: string
  }[]
  onItemClick?: (action: string) => void
}) {
  const navigate = useNavigate()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild={!!item.url && item.url !== '#'}
                onClick={() => {
                  if (item.url && item.url !== '#') {
                    navigate(item.url)
                  } else if (item.action && onItemClick) {
                    onItemClick(item.action)
                  }
                }}
              >
                {item.url && item.url !== '#' ? (
                  <a href={item.url} onClick={(e) => {
                    e.preventDefault()
                    navigate(item.url)
                  }}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                ) : (
                  <>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
