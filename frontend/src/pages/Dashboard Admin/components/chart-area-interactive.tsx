"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useAuth } from "@/context/AuthContext"
import { proyectoService } from "@/services/proyectoService"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  proyectos: {
    label: "Proyectos",
  },
  aprobados: {
    label: "Aprobados",
    color: "var(--primary)",
  },
  en_proceso: {
    label: "En Proceso",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const { usuario } = useAuth()
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [chartData, setChartData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const cargarDatos = React.useCallback(async () => {
    try {
      setLoading(true)
      const dias = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
      const datos = await proyectoService.obtenerDatosGrafico(dias)
      
      // Transformar datos para el gráfico
      const datosTransformados = datos.map((item: any) => ({
        date: item.date,
        aprobados: item.aprobados || 0,
        en_proceso: item.en_proceso || 0,
      }))
      
      setChartData(datosTransformados)
    } catch (error: any) {
      toast.error('Error al cargar datos del gráfico', {
        description: error.response?.data?.message || 'No se pudieron cargar los datos'
      })
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  React.useEffect(() => {
    if (usuario && usuario.rol === 'administrador') {
      cargarDatos()
    }
  }, [usuario, cargarDatos])

  const filteredData = chartData

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Evolución de Proyectos</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Proyectos aprobados y en proceso por fecha
          </span>
          <span className="@[540px]/card:hidden">Proyectos por fecha</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 días
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 días
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              data={filteredData}
              margin={{ top: 60, right: 24, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillAprobados" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-aprobados)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-aprobados)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillEnProceso" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-en_proceso)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-en_proceso)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="en_proceso"
                type="natural"
                fill="url(#fillEnProceso)"
                stroke="var(--color-en_proceso)"
                stackId="a"
              />
              <Area
                dataKey="aprobados"
                type="natural"
                fill="url(#fillAprobados)"
                stroke="var(--color-aprobados)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
