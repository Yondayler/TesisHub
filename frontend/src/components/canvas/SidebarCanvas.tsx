import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, MoreHorizontal, Download, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
// Funciones de date-fns para agrupar por fecha
import { isToday, isYesterday, subDays, isAfter } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TesisListItem {
    id: number;
    titulo: string;
    descripcion: string;
    carrera: string;
    fecha_actualizacion: string;
}

interface SidebarCanvasProps {
    tesisActualId?: number;
    onSeleccionarTesis: (id: number) => void;
    onNuevaTesis: () => void;
    onEliminarTesis: (id: number) => void;
    onExportarWord: () => void;
    onExportarPdf: () => void;
    onBack: () => void; // Nueva prop para volver al chatbot
    exportando?: boolean;
    exportandoPdf?: boolean;
    capitulosGenerados: number;
    totalCapitulos: number;
    tesisList: TesisListItem[];
    loading: boolean;
    isOpen: boolean;
}

type GrupoFecha = 'Hoy' | 'Ayer' | '7 días anteriores' | '30 días anteriores' | 'Más antiguos';

export function SidebarCanvas({
    tesisActualId,
    onSeleccionarTesis,
    onNuevaTesis,
    onEliminarTesis,
    onExportarWord,
    onExportarPdf,
    onBack,
    exportando = false,
    exportandoPdf = false,
    capitulosGenerados,
    totalCapitulos,
    tesisList,
    loading,
    isOpen
}: SidebarCanvasProps) {

    // Agrupar tesis por fecha
    const agruparTesis = () => {
        const grupos: Record<GrupoFecha, TesisListItem[]> = {
            'Hoy': [],
            'Ayer': [],
            '7 días anteriores': [],
            '30 días anteriores': [],
            'Más antiguos': []
        };

        tesisList.forEach(tesis => {
            const fecha = new Date(tesis.fecha_actualizacion);
            if (isToday(fecha)) {
                grupos['Hoy'].push(tesis);
            } else if (isYesterday(fecha)) {
                grupos['Ayer'].push(tesis);
            } else if (isAfter(fecha, subDays(new Date(), 7))) {
                grupos['7 días anteriores'].push(tesis);
            } else if (isAfter(fecha, subDays(new Date(), 30))) {
                grupos['30 días anteriores'].push(tesis);
            } else {
                grupos['Más antiguos'].push(tesis);
            }
        });

        return grupos;
    };

    const grupos = agruparTesis();
    const hayTesis = tesisList.length > 0;

    return (
        <div className={cn(
            "flex flex-col h-full bg-[#f9f9f9] dark:bg-[#1e1e1e] transition-all duration-300 ease-in-out relative w-64 pointer-events-auto",
            !isOpen && "w-0 opacity-0 overflow-hidden pointer-events-none"
        )}>
            {/* Título y botón volver */}
            <div className="p-4 pt-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        size="icon"
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg font-semibold bg-gradient-to-r from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] bg-clip-text text-transparent">
                        Canvas de Tesis
                    </h2>
                </div>
            </div>

            {/* Header con botón Nueva Tesis */}
            <div className="p-4 flex-shrink-0">
                <Button
                    onClick={onNuevaTesis}
                    className="w-full justify-start gap-3 bg-[#dde3ea] hover:bg-[#cdd5df] text-[#444746] dark:bg-[#2c2c2c] dark:hover:bg-[#3c3c3c] dark:text-[#e3e3e3] border-0 h-12 rounded-2xl shadow-none transition-colors"
                >
                    <Plus className="h-5 w-5 text-inherit" />
                    <span className="font-medium text-sm">Nueva Tesis</span>
                </Button>
            </div>

            {/* Sección: Exportar */}
            <div className="p-4 flex-shrink-0">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">
                    Exportar Documento
                </label>
                <div className="space-y-2">
                    <Button
                        onClick={onExportarWord}
                        disabled={exportando || capitulosGenerados === 0}
                        className="w-full justify-start gap-3 bg-[#dde3ea] hover:bg-[#cdd5df] text-[#444746] dark:bg-[#2c2c2c] dark:hover:bg-[#3c3c3c] dark:text-[#e3e3e3] border-0 h-12 rounded-2xl shadow-none transition-colors"
                    >
                        {exportando ? (
                            <Loader2 className="h-5 w-5 animate-spin text-inherit" />
                        ) : (
                            <Download className="h-5 w-5 text-inherit" />
                        )}
                        <span className="font-medium text-sm">{exportando ? 'Exportando...' : 'Exportar a Word'}</span>
                    </Button>
                    <Button
                        onClick={onExportarPdf}
                        disabled={exportandoPdf || capitulosGenerados === 0}
                        className="w-full justify-start gap-3 bg-[#dde3ea] hover:bg-[#cdd5df] text-[#444746] dark:bg-[#2c2c2c] dark:hover:bg-[#3c3c3c] dark:text-[#e3e3e3] border-0 h-12 rounded-2xl shadow-none transition-colors"
                    >
                        {exportandoPdf ? (
                            <Loader2 className="h-5 w-5 animate-spin text-inherit" />
                        ) : (
                            <Download className="h-5 w-5 text-inherit" />
                        )}
                        <span className="font-medium text-sm">{exportandoPdf ? 'Exportando...' : 'Exportar a PDF'}</span>
                    </Button>

                </div>
            </div>
            {/* Lista de Tesis */}
            <div className="flex-1 overflow-y-auto px-3">
                <div className="space-y-6 pb-6">
                    {/* Sección: Mis Tesis */}
                    <div className="w-full">

                        <div className="space-y-6 w-full">
                            {loading ? (
                                <div className="flex flex-col gap-2 p-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-8 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                                    ))}
                                </div>
                            ) : !hayTesis ? (
                                <div className="text-center text-sm text-[var(--muted-foreground)] mt-10 px-4">
                                    <p>No hay tesis guardadas.</p>
                                    <p className="text-xs mt-2">Crea una nueva tesis para comenzar.</p>
                                </div>
                            ) : (
                                Object.entries(grupos).map(([grupo, tesis]) => {
                                    if (tesis.length === 0) return null;

                                    return (
                                        <div key={grupo} className="space-y-1 w-full">
                                            <h3 className="text-xs font-medium text-[var(--muted-foreground)] px-1 mb-2 uppercase tracking-wider">
                                                {grupo}
                                            </h3>
                                            {tesis.map((t) => (
                                                <div
                                                    key={t.id}
                                                    className="relative group w-full"
                                                >
                                                    <button
                                                        onClick={() => onSeleccionarTesis(t.id)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 p-2.5 rounded-full text-sm text-left transition-colors max-w-full",
                                                            tesisActualId === t.id
                                                                ? "bg-[#d3e3fd] text-[#001d35] font-medium dark:bg-[#004a77] dark:text-[#c2e7ff]"
                                                                : "text-[#1f1f1f] dark:text-[#e3e3e3]"
                                                        )}
                                                    >
                                                        <FileText className={cn(
                                                            "h-4 w-4 shrink-0",
                                                            tesisActualId === t.id ? "text-inherit" : "text-gray-500"
                                                        )} />
                                                        <div className="flex flex-col overflow-hidden flex-1 min-w-0 pr-6">
                                                            <span className="truncate text-xs">
                                                                {t.titulo || "Nueva tesis"}
                                                            </span>
                                                            <span className={cn(
                                                                "text-[10px] truncate",
                                                                tesisActualId === t.id ? "text-inherit opacity-80" : "text-gray-500"
                                                            )}>
                                                                {t.carrera}
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
                                                            <DropdownMenuContent align="end" className="w-32">
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600 cursor-pointer gap-2 text-xs"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEliminarTesis(t.id);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
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
            </div>
        </div>
    );
}
