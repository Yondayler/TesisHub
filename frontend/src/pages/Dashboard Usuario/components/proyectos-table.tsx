import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  IconTrash,
  IconFileText,
  IconSearch,
} from "@tabler/icons-react"
import { Proyecto } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProyectosTableProps {
  proyectos: Proyecto[]
  loading?: boolean
  onVer?: (proyecto: Proyecto) => void
  onEditar?: (proyecto: Proyecto) => void
  onEnviar?: (proyecto: Proyecto) => void
  onEliminar?: (proyecto: Proyecto) => void
}

const getEstadoBadge = (estado: string) => {
  const estados: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    borrador: { variant: 'secondary', label: 'Borrador' },
    enviado: { variant: 'default', label: 'Enviado' },
    en_revision: { variant: 'outline', label: 'En Revisión' },
    aprobado: { variant: 'default', label: 'Aprobado' },
    rechazado: { variant: 'destructive', label: 'Rechazado' },
    corregir: { variant: 'outline', label: 'Por Corregir' }
  }
  const config = estados[estado] || estados.borrador
  return <Badge variant={config.variant}>{config.label}</Badge>
}

const formatearFecha = (fecha?: string) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function ProyectosTable({
  proyectos,
  loading = false,
  onVer,
  onEditar,
  onEnviar,
  onEliminar,
}: ProyectosTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const columns: ColumnDef<Proyecto>[] = React.useMemo(
    () => [
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
        accessorKey: "titulo",
        header: "Título",
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (row.original.id) {
                  navigate(`/proyectos/${row.original.id}`)
                }
              }}
              className="font-medium truncate text-left hover:text-primary hover:underline transition-colors cursor-pointer"
            >
              {row.original.titulo}
            </button>
            {row.original.descripcion && (
              <div className="text-sm text-muted-foreground truncate">
                {row.original.descripcion}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => getEstadoBadge(row.original.estado),
      },
      {
        accessorKey: "tutor",
        header: "Tutor Asignado",
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            {row.original.tutor_nombre ? (
              <div className="flex items-center gap-2">
                <IconFileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">
                    {row.original.tutor_nombre} {row.original.tutor_apellido}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Asignado
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconFileText className="h-4 w-4" />
                <span className="text-sm">Sin asignar</span>
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "fecha_creacion",
        header: "Fecha de Creación",
        cell: ({ row }) => formatearFecha(row.original.fecha_creacion),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const proyecto = row.original
          
          return (
            <div className="flex justify-end">
              {onEliminar && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      title="Eliminar proyecto"
                    >
                      <IconTrash className="h-4 w-4" />
                      <span className="sr-only">Eliminar proyecto</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto
                        <span className="font-semibold"> "{proyecto.titulo}"</span> y todos sus datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        onClick={(e) => e.stopPropagation()}
                        className="text-foreground"
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation()
                          onEliminar(proyecto)
                        }}
                        className="bg-white text-black hover:bg-white/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )
        },
      },
    ],
    [onVer, onEditar, onEnviar, onEliminar]
  )

  const table = useReactTable({
    data: proyectos,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (proyectos.length === 0) {
    return (
      <div className="p-6">
        <Empty className="py-12">
          <EmptyMedia variant="icon" className="transition-transform duration-300 hover:scale-110">
            <IconFileText className="h-8 w-8 text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No hay proyectos</EmptyTitle>
            <EmptyDescription>
              Aún no has creado ningún proyecto. Comienza creando uno nuevo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-4 py-4 lg:px-6">
        <div className="relative max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={(table.getColumn("titulo")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("titulo")?.setFilterValue(event.target.value)
            }
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} proyecto(s)
          </div>
        </div>
      </div>
      <div className="border-t overflow-visible">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    // Prevenir que el click en la fila interfiera con los botones
                    const target = e.target as HTMLElement
                    if (target.closest('button') || target.closest('[role="menuitem"]')) {
                      e.stopPropagation()
                      return
                    }
                    // Navegar a detalles del proyecto al hacer click en la fila
                    if (row.original.id) {
                      navigate(`/proyectos/${row.original.id}`)
                    }
                  }}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="relative">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}

