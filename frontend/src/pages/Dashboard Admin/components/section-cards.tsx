import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface EstadisticasAdmin {
  totalProyectos?: number
  proyectosActivos?: number
  nuevosEstudiantes?: number
  tasaAprobacion?: number
  variacionEstudiantes?: number
  variacionProyectos?: number
  variacionAprobacion?: number
}

interface SectionCardsProps {
  estadisticas?: EstadisticasAdmin | null
  loading?: boolean
}

export function SectionCards({ estadisticas, loading = false }: SectionCardsProps) {
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "0"
    return num.toLocaleString('es-ES')
  }

  const formatPercent = (num: number | undefined) => {
    if (num === undefined || num === null) return "0%"
    return `${num.toFixed(1)}%`
  }

  const getVariacionIcon = (variacion: number | undefined) => {
    if (variacion === undefined || variacion === null) return null
    return variacion >= 0 ? <IconTrendingUp /> : <IconTrendingDown />
  }

  const getVariacionText = (variacion: number | undefined) => {
    if (variacion === undefined || variacion === null) return "+0%"
    const sign = variacion >= 0 ? "+" : ""
    return `${sign}${variacion.toFixed(1)}%`
  }

  const totalProyectos = estadisticas?.totalProyectos || 0
  const nuevosEstudiantes = estadisticas?.nuevosEstudiantes || 0
  const proyectosActivos = estadisticas?.proyectosActivos || 0
  const tasaAprobacion = estadisticas?.tasaAprobacion || 0

  const variacionProyectos = estadisticas?.variacionProyectos || 0
  const variacionEstudiantes = estadisticas?.variacionEstudiantes || 0
  const variacionAprobacion = estadisticas?.variacionAprobacion || 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Proyectos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "..." : formatNumber(totalProyectos)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getVariacionIcon(variacionProyectos)}
              {getVariacionText(variacionProyectos)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {variacionProyectos >= 0 ? (
              <>
                Crecimiento este mes {getVariacionIcon(variacionProyectos) && <IconTrendingUp className="size-4" />}
              </>
            ) : (
              <>
                Disminución este mes {getVariacionIcon(variacionProyectos) && <IconTrendingDown className="size-4" />}
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            Proyectos registrados en el sistema
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Nuevos Estudiantes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "..." : formatNumber(nuevosEstudiantes)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {getVariacionIcon(variacionEstudiantes)}
              {getVariacionText(variacionEstudiantes)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {variacionEstudiantes >= 0 ? (
              <>
                Crecimiento este mes {getVariacionIcon(variacionEstudiantes) && <IconTrendingUp className="size-4" />}
              </>
            ) : (
              <>
                Disminución este mes {getVariacionIcon(variacionEstudiantes) && <IconTrendingDown className="size-4" />}
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            Estudiantes registrados este mes
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Proyectos Activos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "..." : formatNumber(proyectosActivos)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {getVariacionText(variacionProyectos)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            En proceso de revisión <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Proyectos enviados o en revisión</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tasa de Aprobación</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "..." : formatPercent(tasaAprobacion)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {getVariacionText(variacionAprobacion)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rendimiento estable <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Porcentaje de proyectos aprobados</div>
        </CardFooter>
      </Card>
    </div>
  )
}
