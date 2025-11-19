import { Proyecto } from '../types';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Send, Trash2, FileText } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';

interface TablaProyectosProps {
  proyectos: Proyecto[];
  onVer?: (proyecto: Proyecto) => void;
  onEditar?: (proyecto: Proyecto) => void;
  onEnviar?: (proyecto: Proyecto) => void;
  onEliminar?: (proyecto: Proyecto) => void;
}

const getEstadoBadge = (estado: string) => {
  const estados: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, className: string }> = {
    borrador: {
      variant: 'secondary',
      label: 'Borrador',
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    enviado: {
      variant: 'default',
      label: 'Enviado',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    en_revision: {
      variant: 'default',
      label: 'En Revisión',
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    aprobado: {
      variant: 'default',
      label: 'Aprobado',
      className: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    rechazado: {
      variant: 'destructive',
      label: 'Rechazado',
      className: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    corregir: {
      variant: 'default',
      label: 'Por Corregir',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    }
  };

  const config = estados[estado] || estados.borrador;
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

const formatearFecha = (fecha?: string) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const TablaProyectos = ({
  proyectos,
  onVer,
  onEditar,
  onEnviar,
  onEliminar
}: TablaProyectosProps) => {
  if (proyectos.length === 0) {
    return (
      <Empty className="py-12">
        <EmptyMedia variant="icon" className="transition-transform duration-300 hover:scale-110">
          <FileText className="h-8 w-8 text-gray-400" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No hay proyectos</EmptyTitle>
          <EmptyDescription>
            Aún no has creado ningún proyecto. Comienza creando uno nuevo.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold">Título</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">Fecha Creación</TableHead>
            <TableHead className="font-semibold">Versión</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proyectos.map((proyecto, index) => (
            <TableRow 
              key={proyecto.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => onVer?.(proyecto)}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-gray-900 group-hover:text-blue-600 transition-colors">
                    {proyecto.titulo}
                  </span>
                  {proyecto.tutor_nombre && (
                    <span className="text-xs text-gray-500">
                      Tutor: {proyecto.tutor_nombre} {proyecto.tutor_apellido}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getEstadoBadge(proyecto.estado)}
              </TableCell>
              <TableCell className="text-gray-600">
                {formatearFecha(proyecto.fecha_creacion)}
              </TableCell>
              <TableCell className="text-gray-600">
                v{proyecto.version}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0 hover:bg-gray-100 transition-all duration-200"
                    >
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onVer && (
                      <DropdownMenuItem 
                        onClick={() => onVer(proyecto)}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </DropdownMenuItem>
                    )}
                    {onEditar && (proyecto.estado === 'borrador' || proyecto.estado === 'corregir') && (
                      <DropdownMenuItem 
                        onClick={() => onEditar(proyecto)}
                        className="cursor-pointer hover:bg-purple-50 transition-colors"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onEnviar && (proyecto.estado === 'borrador' || proyecto.estado === 'corregir') && (
                      <DropdownMenuItem 
                        onClick={() => onEnviar(proyecto)}
                        className="cursor-pointer hover:bg-green-50 transition-colors"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                      </DropdownMenuItem>
                    )}
                    {onEliminar && proyecto.estado === 'borrador' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onEliminar(proyecto)}
                          className="text-red-600 cursor-pointer hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};


