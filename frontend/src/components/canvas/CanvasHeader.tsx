import { Menu, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HerramientasEditor } from './HerramientasEditor';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";

interface CanvasHeaderProps {
    tituloTesis?: string;
    onToggleSidebar: () => void;
    onRegenerar?: () => void;
    editor: Editor | null;
    proveedorSeleccionado?: 'gemini' | 'groq';
    onProveedorChange?: (provider: 'gemini' | 'groq') => void;
}

export function CanvasHeader({
    tituloTesis,
    onToggleSidebar,
    onRegenerar,
    editor,
    proveedorSeleccionado = 'groq',
    onProveedorChange
}: CanvasHeaderProps) {
    return (
        <div className="flex flex-col border-b border-[var(--border)] bg-[var(--card)] shadow-sm z-10">
            {/* Primera fila: Navegación y título */}
            <div className="h-16 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSidebar}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {tituloTesis && (
                        <h1 className="text-lg font-semibold text-[var(--foreground)]">{tituloTesis}</h1>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle de Proveedor LLM */}
                    {onProveedorChange && (
                        <div className="flex items-center gap-1 bg-[var(--muted)] rounded-full p-1">
                            <button
                                onClick={() => onProveedorChange('groq')}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                                    proveedorSeleccionado === 'groq'
                                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
                                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                )}
                                title="Groq (14,400 requests/día)"
                            >
                                Groq
                            </button>
                            <button
                                onClick={() => onProveedorChange('gemini')}
                                className={cn(
                                    "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                                    proveedorSeleccionado === 'gemini'
                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm"
                                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                )}
                                title="Gemini (20 requests/día)"
                            >
                                Gemini
                            </button>
                        </div>
                    )}

                    {/* Botón de regeneración con AlertDialog */}
                    {onRegenerar && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Regenerar Tesis
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción regenerará toda la tesis desde cero. Se perderá todo el contenido actual y no se podrá recuperar.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={onRegenerar}>Continuar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Segunda fila: Herramientas de edición */}
            <div className="border-t border-[var(--border)] px-6 py-2">
                <HerramientasEditor editor={editor} />
            </div>
        </div>
    );
}
