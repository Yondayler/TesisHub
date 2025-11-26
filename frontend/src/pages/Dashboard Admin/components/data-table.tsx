"use client"

import * as React from "react"
import { useAuth } from "@/context/AuthContext"
import { proyectoService } from "@/services/proyectoService"
import { usuarioService } from "@/services/usuarioService"
import { Proyecto, Usuario } from "@/types"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLoader,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { SimpleMenu, SimpleMenuItem, SimpleMenuSeparator } from "@/components/ui/simple-menu"

export const schema = z.object({
  id: z.number(),
  header: z.string(), // Título del proyecto
  type: z.string(), // Estado del proyecto
  target: z.string(), // Fecha de creación
  limit: z.string(), // Fecha límite o versión
  reviewer: z.string(), // Tutor asignado
  proyectoOriginal: z.any().optional(), // Proyecto original para referencia
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Título del Proyecto",
    cell: ({ row, table }) => {
      const { tutores, handleAsignarTutor } = (table.options.meta as any) || {}
      return <TableCellViewer 
        item={row.original} 
        tutores={tutores || []}
        onAsignarTutor={handleAsignarTutor || (() => {})}
      />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Estado",
    cell: ({ row }) => {
      const proyecto = (row.original as any).proyectoOriginal as Proyecto
      const estado = proyecto?.estado

      const estados: Record<
        string,
        { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
      > = {
        borrador: { variant: "secondary", label: "Borrador" },
        enviado: { variant: "default", label: "Enviado" },
        en_revision: { variant: "outline", label: "En Revisión" },
        aprobado: { variant: "default", label: "Aprobado" },
        rechazado: { variant: "destructive", label: "Rechazado" },
        corregir: { variant: "outline", label: "Por Corregir" },
      }

      const config = estados[estado as string] || estados["borrador"]

      return (
        <div className="w-32">
          <Badge variant={config.variant} className="px-1.5 text-xs">
            {config.label}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Fecha Creación</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm text-muted-foreground">
        {row.original.target}
      </div>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Versión</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm text-muted-foreground">
        {row.original.limit}
      </div>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Tutor Asignado",
    cell: ({ row, table }) => {
      const proyecto = (row.original as any).proyectoOriginal as Proyecto
      const tutorActual = proyecto?.tutor_id
      const { tutores, handleAsignarTutor } = (table.options.meta as any) || {}
      
      // Encontrar el tutor actual
      const tutorActualObj = tutores?.find((t: Usuario) => t.id === tutorActual)
      const tutorNombre = tutorActualObj 
        ? `${tutorActualObj.nombre} ${tutorActualObj.apellido}`
        : "Asignar tutor"

      return (
        <div className="relative w-full">
          <SimpleMenu
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-between text-left font-normal"
              >
                <span className="truncate flex-1 text-left">{tutorNombre}</span>
                <IconChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            }
            align="start"
            side="bottom"
            className="min-w-[200px]"
          >
          <SimpleMenuItem
            onClick={() => {
              if (proyecto?.id && handleAsignarTutor) {
                handleAsignarTutor(proyecto.id, null)
              }
            }}
          >
            Sin asignar
          </SimpleMenuItem>
          {(tutores || []).length > 0 && <SimpleMenuSeparator />}
          {(tutores || []).map((tutor: Usuario) => (
            <SimpleMenuItem
              key={tutor.id}
              onClick={() => {
                if (proyecto?.id && handleAsignarTutor && tutor.id) {
                  handleAsignarTutor(proyecto.id, tutor.id)
                }
              }}
            >
              {tutor.nombre} {tutor.apellido}
            </SimpleMenuItem>
          ))}
        </SimpleMenu>
        </div>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// Función para transformar proyectos al formato de la tabla
const transformarProyecto = (proyecto: Proyecto): z.infer<typeof schema> => {
  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getEstadoLabel = (estado: string) => {
    const estados: Record<string, string> = {
      borrador: 'Borrador',
      enviado: 'Enviado',
      en_revision: 'En Revisión',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      corregir: 'Por Corregir'
    }
    return estados[estado] || estado
  }

  const tutorNombre = proyecto.tutor_nombre && proyecto.tutor_apellido
    ? `${proyecto.tutor_nombre} ${proyecto.tutor_apellido}`
    : 'Asignar tutor'

  return {
    id: proyecto.id || 0,
    header: proyecto.titulo,
    type: getEstadoLabel(proyecto.estado),
    target: formatearFecha(proyecto.fecha_creacion),
    limit: proyecto.version?.toString() || '1',
    reviewer: tutorNombre,
    proyectoOriginal: proyecto // Guardar el proyecto original para referencia
  }
}

export function DataTable() {
  const { usuario } = useAuth()
  const [proyectos, setProyectos] = React.useState<Proyecto[]>([])
  const [tutores, setTutores] = React.useState<Usuario[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tabActivo, setTabActivo] = React.useState("outline")
  
  // Transformar proyectos a formato de tabla
  const dataTransformada = React.useMemo(() => {
    let proyectosFiltrados = proyectos

    // Filtrar por tab activo
    if (tabActivo === "past-performance") {
      proyectosFiltrados = proyectos.filter(p => p.estado === 'en_revision' || p.estado === 'corregir')
    } else if (tabActivo === "key-personnel") {
      proyectosFiltrados = proyectos.filter(p => p.estado === 'aprobado')
    } else if (tabActivo === "focus-documents") {
      // Rechazados
      proyectosFiltrados = proyectos.filter(p => p.estado === 'rechazado')
    }

    return proyectosFiltrados.map(transformarProyecto)
  }, [proyectos, tabActivo])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // Cargar proyectos y tutores al montar
  React.useEffect(() => {
    if (usuario && usuario.rol === 'administrador') {
      cargarDatos()
    }
  }, [usuario])

  // Resetear paginación cuando cambia el filtro
  React.useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [tabActivo])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [proyectosData, tutoresData] = await Promise.all([
        proyectoService.obtenerProyectos(),
        usuarioService.obtenerTutores()
      ])
      setProyectos(proyectosData)
      setTutores(tutoresData)
    } catch (error: any) {
      toast.error('Error al cargar datos', {
        description: error.response?.data?.message || 'No se pudieron cargar los datos'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAsignarTutor = async (proyectoId: number, tutorId: number | null) => {
    try {
      if (tutorId) {
        const proyectoActualizado = await proyectoService.asignarTutor(proyectoId, tutorId)
        toast.success('Tutor asignado correctamente')
        // Actualizar el proyecto en el estado local
        setProyectos(prev => prev.map(p => p.id === proyectoId ? proyectoActualizado : p))
      } else {
        const proyectoActualizado = await proyectoService.removerTutor(proyectoId)
        toast.success('Tutor removido correctamente')
        // Actualizar el proyecto en el estado local
        setProyectos(prev => prev.map(p => p.id === proyectoId ? proyectoActualizado : p))
      }
      // Recargar datos para asegurar sincronización
      await cargarDatos()
    } catch (error: any) {
      console.error('Error al asignar tutor:', error)
      toast.error('Error al asignar tutor', {
        description: error.response?.data?.message || error.message || 'No se pudo asignar el tutor'
      })
    }
  }

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => dataTransformada?.map(({ id }) => id) || [],
    [dataTransformada]
  )

  const table = useReactTable({
    data: dataTransformada, // Usar directamente dataTransformada en lugar de data
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      tutores,
      handleAsignarTutor,
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  // Contar proyectos por estado para los badges
  const enRevisionCount = proyectos.filter(p => p.estado === 'en_revision' || p.estado === 'corregir').length
  const aprobadosCount = proyectos.filter(p => p.estado === 'aprobado').length
  const rechazadosCount = proyectos.filter(p => p.estado === 'rechazado').length

  return (
    <Tabs
      defaultValue="outline"
      value={tabActivo}
      onValueChange={setTabActivo}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Todos los Proyectos</SelectItem>
            <SelectItem value="past-performance">En Revisión</SelectItem>
            <SelectItem value="key-personnel">Aprobados</SelectItem>
            <SelectItem value="focus-documents">Rechazados</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Todos los Proyectos</TabsTrigger>
          <TabsTrigger value="past-performance">
            En Revisión{" "}
            <Badge
              variant="secondary"
              className="bg-white text-black dark:bg-white dark:text-black"
            >
              {enRevisionCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Aprobados{" "}
            <Badge
              variant="secondary"
              className="bg-white text-black dark:bg-white dark:text-black"
            >
              {aprobadosCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">
            Rechazados{" "}
            <Badge
              variant="secondary"
              className="bg-white text-black dark:bg-white dark:text-black"
            >
              {rechazadosCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
        </div>
      </div>
      {/* Contenido de tabla reutilizado para todas las pestañas.
          El filtrado real se hace en dataTransformada según tabActivo. */}
      {["outline", "past-performance", "key-personnel", "focus-documents"].map(
        (tab) => (
          <TabsContent
            key={tab}
            value={tab}
            className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
          >
            <div className="overflow-hidden rounded-lg border">
              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
                id={sortableId}
              >
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} colSpan={header.colSpan}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="**:data-[slot=table-cell]:first:w-8">
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          Cargando proyectos...
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      <SortableContext
                        items={dataIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map((row) => (
                          <DraggableRow key={row.id} row={row} />
                        ))}
                      </SortableContext>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No hay proyectos disponibles.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
          </div>
              <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label
                    htmlFor={`rows-per-page-${tab}`}
                    className="text-sm font-medium"
                  >
                    Filas por página
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value))
                    }}
                  >
                  <SelectTrigger
                      size="sm"
                      className="w-20"
                      id={`rows-per-page-${tab}`}
                    >
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-fit items-center justify-center text-sm font-medium">
                  Página {table.getState().pagination.pageIndex + 1} de{" "}
                  {table.getPageCount()}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Ir a la primera página</span>
                    <IconChevronsLeft />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Ir a la página anterior</span>
                    <IconChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Ir a la página siguiente</span>
                    <IconChevronRight />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Ir a la última página</span>
                    <IconChevronsRight />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )
      )}
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ 
  item, 
  tutores, 
  onAsignarTutor 
}: { 
  item: z.infer<typeof schema>
  tutores: Usuario[]
  onAsignarTutor: (proyectoId: number, tutorId: number | null) => void
}) {
  const isMobile = useIsMobile()
  const proyecto = (item as any).proyectoOriginal as Proyecto

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Información detallada del proyecto
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Estado: {item.type}
                </div>
                <div className="text-muted-foreground">
                  {(item as any).proyectoOriginal?.descripcion || 'Sin descripción disponible'}
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Título del Proyecto</Label>
              <Input id="header" defaultValue={item.header} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Estado</Label>
                <Select defaultValue={item.type} disabled>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Borrador">Borrador</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="En Revisión">En Revisión</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                    <SelectItem value="Por Corregir">Por Corregir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Estado Visual</Label>
                <Select defaultValue={item.status} disabled>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Completado</SelectItem>
                    <SelectItem value="In Process">En Proceso</SelectItem>
                    <SelectItem value="Not Started">No Iniciado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Fecha de Creación</Label>
                <Input id="target" defaultValue={item.target} readOnly />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Versión</Label>
                <Input id="limit" defaultValue={item.limit} readOnly />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Tutor Asignado</Label>
              {(() => {
                const tutorActualObj = tutores.find((t: Usuario) => t.id === proyecto?.tutor_id)
                const tutorNombre = tutorActualObj 
                  ? `${tutorActualObj.nombre} ${tutorActualObj.apellido}`
                  : "Asignar tutor"
                
                return (
                  <SimpleMenu
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        id="reviewer"
                      >
                        <span>{tutorNombre}</span>
                        <IconChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }
                    align="start"
                    side="bottom"
                  >
                    <SimpleMenuItem
                      onClick={() => {
                        if (proyecto?.id) {
                          onAsignarTutor(proyecto.id, null)
                        }
                      }}
                    >
                      Sin asignar
                    </SimpleMenuItem>
                    {tutores.length > 0 && <SimpleMenuSeparator />}
                    {tutores.map((tutor: Usuario) => (
                      <SimpleMenuItem
                        key={tutor.id}
                        onClick={() => {
                          if (proyecto?.id && tutor.id) {
                            onAsignarTutor(proyecto.id, tutor.id)
                          }
                        }}
                      >
                        {tutor.nombre} {tutor.apellido}
                      </SimpleMenuItem>
                    ))}
                  </SimpleMenu>
                )
              })()}
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Guardar Cambios</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
