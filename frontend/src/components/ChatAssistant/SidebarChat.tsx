import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { chatService, Conversacion } from '@/services/chatService';
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarChatProps {
    proyectoId?: number;
    conversacionActualId?: number;
    onSeleccionarConversacion: (id: number) => void;
    onNuevaConversacion: () => void;
    isOpen: boolean;
}

type GrupoFecha = 'Hoy' | 'Ayer' | '7 días anteriores' | '30 días anteriores' | 'Más antiguos';

export function SidebarChat({
    proyectoId,
    conversacionActualId,
    onSeleccionarConversacion,
    onNuevaConversacion,
    isOpen
}: SidebarChatProps) {
    const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarConversaciones();
    }, [proyectoId]);

    useEffect(() => {
        if (conversacionActualId) {
            cargarConversaciones();
        }
    }, [conversacionActualId]);

    const cargarConversaciones = async () => {
        try {
            setLoading(true);
            const data = await chatService.listarConversaciones(proyectoId);
            setConversaciones(data);
        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: number) => {
        try {
            await chatService.eliminarConversacion(id);
            setConversaciones(prev => prev.filter(c => c.id !== id));
            if (conversacionActualId === id) {
                onNuevaConversacion();
            }
        } catch (error) {
            console.error('Error al eliminar conversación:', error);
        }
    };

    // Agrupar conversaciones por fecha
    const agruparConversaciones = () => {
        const grupos: Record<GrupoFecha, Conversacion[]> = {
            'Hoy': [],
            'Ayer': [],
            '7 días anteriores': [],
            '30 días anteriores': [],
            'Más antiguos': []
        };

        conversaciones.forEach(conv => {
            const fecha = new Date(conv.fecha_actualizacion);
            if (isToday(fecha)) {
                grupos['Hoy'].push(conv);
            } else if (isYesterday(fecha)) {
                grupos['Ayer'].push(conv);
            } else if (isAfter(fecha, subDays(new Date(), 7))) {
                grupos['7 días anteriores'].push(conv);
            } else if (isAfter(fecha, subDays(new Date(), 30))) {
                grupos['30 días anteriores'].push(conv);
            } else {
                grupos['Más antiguos'].push(conv);
            }
        });

        return grupos;
    };

    const grupos = agruparConversaciones();
    const hayConversaciones = conversaciones.length > 0;

    return (
        <div className={cn(
            "flex flex-col h-full bg-[#f9f9f9] dark:bg-[#1e1e1e] transition-all duration-300 ease-in-out relative w-64",
            !isOpen && "w-0 opacity-0 overflow-hidden"
        )}>
            {/* Header con botón Nueva Conversación */}
            <div className="p-4 pt-6 flex-shrink-0">
                <Button
                    onClick={onNuevaConversacion}
                    className="w-full justify-start gap-3 bg-[#dde3ea] hover:bg-[#cdd5df] text-[#444746] dark:bg-[#2c2c2c] dark:hover:bg-[#3c3c3c] dark:text-[#e3e3e3] border-0 h-12 rounded-2xl shadow-none transition-colors"
                >
                    <Plus className="h-5 w-5 text-inherit" />
                    <span className="font-medium text-sm">Nueva conversación</span>
                </Button>
            </div>

            {/* Lista de Conversaciones */}
            <div className="flex-1 overflow-y-auto px-3">
                <div className="space-y-6 pb-6">
                    {loading ? (
                        <div className="flex flex-col gap-2 p-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                            ))}
                        </div>
                    ) : !hayConversaciones ? (
                        <div className="text-center text-sm text-gray-500 mt-10 px-4">
                            <p>No hay conversaciones recientes.</p>
                            <p className="text-xs mt-2">Inicia un nuevo chat para comenzar.</p>
                        </div>
                    ) : (
                        Object.entries(grupos).map(([grupo, convs]) => {
                            if (convs.length === 0) return null;

                            return (
                                <div key={grupo} className="space-y-1">
                                    <h3 className="text-xs font-medium text-gray-500 px-3 mb-2 uppercase tracking-wider">
                                        {grupo}
                                    </h3>
                                    {convs.map((conv) => (
                                        <div
                                            key={conv.id}
                                            className="relative group"
                                        >
                                            <button
                                                onClick={() => onSeleccionarConversacion(conv.id)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-2.5 rounded-full text-sm text-left transition-colors group-hover:bg-[#edeff2] dark:group-hover:bg-[#2a2a2a]",
                                                    conversacionActualId === conv.id
                                                        ? "bg-[#d3e3fd] text-[#001d35] font-medium dark:bg-[#004a77] dark:text-[#c2e7ff]"
                                                        : "text-[#1f1f1f] dark:text-[#e3e3e3]"
                                                )}
                                            >
                                                <MessageSquare className={cn(
                                                    "h-4 w-4 shrink-0",
                                                    conversacionActualId === conv.id ? "text-inherit" : "text-gray-500"
                                                )} />
                                                <div className="flex flex-col overflow-hidden flex-1 pr-6">
                                                    <span className="truncate">
                                                        {conv.titulo || "Nueva conversación"}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] truncate",
                                                        conversacionActualId === conv.id ? "text-inherit opacity-80" : "text-gray-500"
                                                    )}>
                                                        {format(new Date(conv.fecha_actualizacion), "h:mm a", { locale: es })}
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Menú de opciones (3 puntos) */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 cursor-pointer gap-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEliminar(conv.id);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
