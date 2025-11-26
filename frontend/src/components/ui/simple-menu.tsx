"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface SimpleMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end" | "center"
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function SimpleMenu({
  trigger,
  children,
  align = "end",
  side = "right",
  className,
}: SimpleMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  const calculatePosition = React.useCallback(() => {
    if (!triggerRef.current) return { top: 0, left: 0 }

    const rect = triggerRef.current.getBoundingClientRect()
    const menuElement = menuRef.current
    const menuWidth = menuElement?.offsetWidth || 224 // w-56 = 14rem = 224px
    const menuHeight = menuElement?.offsetHeight || 200 // Aproximado
    const offset = 8 // Aumentado para mejor separación

    let top = 0
    let left = 0

    switch (side) {
      case "right":
        // Ajustar posición vertical según align
        if (align === "start") {
          top = rect.top
        } else if (align === "center") {
          top = rect.top + (rect.height / 2) - (menuHeight / 2)
        } else {
          // align === "end" - alinear con la parte inferior del botón
          top = rect.bottom - menuHeight
        }
        left = rect.right + offset
        break
      case "left":
        top = rect.top
        left = rect.left - menuWidth - offset
        break
      case "top":
        top = rect.top - menuHeight - offset
        if (align === "start") {
          left = rect.left
        } else if (align === "end") {
          left = rect.right - menuWidth
        } else {
          // align === "center"
          left = rect.left + (rect.width / 2) - (menuWidth / 2)
        }
        break
      case "bottom":
        // Posicionar debajo del botón
        top = rect.bottom + offset
        if (align === "start") {
          left = rect.left
        } else if (align === "end") {
          left = rect.right - menuWidth
        } else {
          // align === "center"
          left = rect.left + (rect.width / 2) - (menuWidth / 2)
        }
        break
    }

    // Ajustar si se sale de la pantalla
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - offset
    }
    if (left < 0) {
      left = offset
    }
    if (top + menuHeight > window.innerHeight) {
      // Si no cabe abajo, mostrar arriba
      if (side === "bottom") {
        top = rect.top - menuHeight - offset
      } else {
        top = window.innerHeight - menuHeight - offset
      }
    }
    if (top < 0) {
      top = offset
    }

    return { top, left }
  }, [side, align])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen && triggerRef.current) {
      // Calcular posición inicial inmediatamente basada en el trigger
      const rect = triggerRef.current.getBoundingClientRect()
      const menuWidth = 224
      const offset = 8
      let initialTop = 0
      let initialLeft = 0

      if (side === "bottom") {
        initialTop = rect.bottom + offset
        if (align === "start") {
          initialLeft = rect.left
        } else if (align === "end") {
          initialLeft = rect.right - menuWidth
        } else {
          initialLeft = rect.left + (rect.width / 2) - (menuWidth / 2)
        }
      } else if (side === "top") {
        initialTop = rect.top - 200 - offset // altura aproximada
        if (align === "start") {
          initialLeft = rect.left
        } else if (align === "end") {
          initialLeft = rect.right - menuWidth
        } else {
          initialLeft = rect.left + (rect.width / 2) - (menuWidth / 2)
        }
      } else if (side === "right") {
        initialTop = align === "start" ? rect.top : (align === "end" ? rect.bottom - 200 : rect.top + (rect.height / 2) - 100)
        initialLeft = rect.right + offset
      } else { // left
        initialTop = rect.top
        initialLeft = rect.left - menuWidth - offset
      }

      // Ajustar si se sale de la pantalla
      if (initialLeft + menuWidth > window.innerWidth) {
        initialLeft = window.innerWidth - menuWidth - offset
      }
      if (initialLeft < 0) {
        initialLeft = offset
      }
      if (initialTop + 200 > window.innerHeight) {
        if (side === "bottom") {
          initialTop = rect.top - 200 - offset
        } else {
          initialTop = window.innerHeight - 200 - offset
        }
      }
      if (initialTop < 0) {
        initialTop = offset
      }

      setPosition({ top: initialTop, left: initialLeft })

      document.addEventListener("mousedown", handleClickOutside)
      
      // Recalcular después de que el menú se renderice para usar dimensiones reales
      let timer: NodeJS.Timeout
      let rafTimer: number
      
      timer = setTimeout(() => {
        const pos = calculatePosition()
        if (pos.top > 0 && pos.left > 0) {
          setPosition(pos)
        }
      }, 50)
      
      // También recalcular en el siguiente frame para asegurar dimensiones correctas
      rafTimer = requestAnimationFrame(() => {
        const pos = calculatePosition()
        if (pos.top > 0 && pos.left > 0) {
          setPosition(pos)
        }
      })
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        clearTimeout(timer)
        cancelAnimationFrame(rafTimer)
      }
    } else if (!isOpen) {
      setPosition({ top: 0, left: 0 })
    }
  }, [isOpen, calculatePosition, side, align])

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const menuContent = isOpen && mounted ? (
    <>
      <div
        ref={menuRef}
        className={cn(
          "fixed w-56 rounded-lg border bg-popover text-popover-foreground shadow-lg p-1",
          "animate-in fade-in-0 zoom-in-95 duration-150",
          className
        )}
        style={{
          top: position.top > 0 ? `${position.top}px` : 'auto',
          left: position.left > 0 ? `${position.left}px` : 'auto',
          visibility: position.top === 0 && position.left === 0 ? 'hidden' : 'visible',
          zIndex: 999999, // Aumentado para estar por encima de los modales
        }}
        onClick={(e) => e.stopPropagation()} // Evitar que se cierre al hacer clic dentro
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SimpleMenuItem) {
            return React.cloneElement(child, { onClose: handleClose } as any)
          }
          return child
        })}
      </div>
      {/* Overlay para cerrar al hacer clic fuera */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 999998 }} // Aumentado para estar por encima de los modales
        onClick={() => setIsOpen(false)}
      />
    </>
  ) : null

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {mounted && menuContent && createPortal(menuContent, document.body)}
    </div>
  )
}

interface SimpleMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  onClose?: () => void
}

export function SimpleMenuItem({
  children,
  onClick,
  className,
  onClose,
}: SimpleMenuItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('SimpleMenuItem clicked') // Debug
    
    if (onClick) {
      console.log('Executing onClick') // Debug
      onClick()
    }
    
    // Cerrar después de un pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      console.log('Closing menu') // Debug
      onClose?.()
    }, 50)
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

interface SimpleMenuLabelProps {
  children: React.ReactNode
  className?: string
}

export function SimpleMenuLabel({
  children,
  className,
}: SimpleMenuLabelProps) {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-medium", className)}>
      {children}
    </div>
  )
}

interface SimpleMenuSeparatorProps {
  className?: string
}

export function SimpleMenuSeparator({ className }: SimpleMenuSeparatorProps) {
  return <div className={cn("my-1 h-px bg-border -mx-1", className)} />
}

interface SimpleMenuGroupProps {
  children: React.ReactNode
  className?: string
}

export function SimpleMenuGroup({
  children,
  className,
}: SimpleMenuGroupProps) {
  return <div className={cn("", className)}>{children}</div>
}



