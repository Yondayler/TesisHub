"use client"

import { EstadisticasProyecto, Usuario } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle
} from "lucide-react"

interface SectionCardsProps {
  estadisticas: EstadisticasProyecto | null
  loading: boolean
  usuario: Usuario | null
}

export function SectionCards({ estadisticas, loading, usuario }: SectionCardsProps) {
  if (loading || !estadisticas) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total de Proyectos",
      value: estadisticas.total,
      description: "Proyectos asignados",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Aprobados",
      value: estadisticas.aprobados,
      description: "Proyectos finalizados",
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Por Corregir",
      value: estadisticas.corregir,
      description: "Necesitan correcciones",
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <CardDescription className="text-xs mt-1">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
