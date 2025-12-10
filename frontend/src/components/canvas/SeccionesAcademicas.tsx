import { SeccionAcademica, EstadoSeccion } from '@/types/canvas';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeccionesAcademicasProps {
    seccionActual: SeccionAcademica;
    estadoSecciones: EstadoSeccion[];
    onSeleccionarSeccion: (seccion: SeccionAcademica) => void;
}

const SECCIONES_INFO: Record<SeccionAcademica, { titulo: string; descripcion: string }> = {
    portada: { titulo: 'Portada', descripcion: 'Información institucional y del proyecto' },
    indice: { titulo: 'Índice', descripcion: 'Tabla de contenidos' },
    resumen: { titulo: 'Resumen', descripcion: 'Síntesis del trabajo' },
    introduccion: { titulo: 'Introducción', descripcion: 'Planteamiento y objetivos' },
    diagnostico: { titulo: 'Diagnóstico Situacional', descripcion: 'Análisis del contexto y justificación' },
    herramientas: { titulo: 'Herramientas de Desarrollo', descripcion: 'Selección de tecnologías y metodología' },
    desarrollo: { titulo: 'Desarrollo del Sistema', descripcion: 'Diseño, codificación y módulos' },
    pruebas: { titulo: 'Fase de Pruebas', descripcion: 'Plan de pruebas y resultados' },
    marco_teorico: { titulo: 'Marco Teórico', descripcion: 'Fundamentos teóricos' },
    metodologia: { titulo: 'Metodología', descripcion: 'Diseño y procedimientos' },
    resultados: { titulo: 'Resultados', descripcion: 'Análisis y hallazgos' },
    conclusiones: { titulo: 'Conclusiones', descripcion: 'Síntesis de resultados' },
    recomendaciones: { titulo: 'Recomendaciones', descripcion: 'Sugerencias y trabajos futuros' },
    referencias: { titulo: 'Referencias', descripcion: 'Bibliografía' }
};

export function SeccionesAcademicas({
    seccionActual,
    estadoSecciones,
    onSeleccionarSeccion
}: SeccionesAcademicasProps) {

    const getEstadoSeccion = (seccion: SeccionAcademica): EstadoSeccion | undefined => {
        return estadoSecciones.find(e => e.seccion === seccion);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--card)] border-r border-[var(--border)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Estructura de la Tesis
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Secciones académicas estándar
                </p>
            </div>

            {/* Lista de Secciones */}
            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {(Object.keys(SECCIONES_INFO) as SeccionAcademica[]).map((seccion) => {
                        // Filtrar secciones que no están en el estado actual (para soportar diferentes tipos de tesis)
                        const estado = getEstadoSeccion(seccion);
                        if (!estado) return null;

                        const info = SECCIONES_INFO[seccion];
                        const isActual = seccion === seccionActual;
                        const isCompletada = estado?.completada || false;
                        const isGenerando = estado?.generando || false;

                        return (
                            <button
                                key={seccion}
                                onClick={() => onSeleccionarSeccion(seccion)}
                                className={cn(
                                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                                    "hover:bg-[var(--accent)] hover:shadow-sm",
                                    isActual && "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md",
                                    !isActual && "bg-[var(--background)]"
                                )}
                            >
                                {/* Icono de estado */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {isGenerando ? (
                                        <Loader2 className={cn(
                                            "h-5 w-5 animate-spin",
                                            isActual ? "text-inherit" : "text-[var(--primary)]"
                                        )} />
                                    ) : isCompletada ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <FileText className={cn(
                                            "h-5 w-5",
                                            isActual ? "text-inherit" : "text-[var(--muted-foreground)]"
                                        )} />
                                    )}
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={cn(
                                            "font-medium text-sm truncate",
                                            isActual ? "text-inherit" : "text-[var(--foreground)]"
                                        )}>
                                            {info.titulo}
                                        </h3>
                                        {estado && estado.paginas > 0 && (
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full",
                                                isActual
                                                    ? "bg-white/20 text-inherit"
                                                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                                            )}>
                                                {estado.paginas} pág{estado.paginas !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn(
                                        "text-xs mt-0.5 truncate",
                                        isActual ? "text-inherit opacity-90" : "text-[var(--muted-foreground)]"
                                    )}>
                                        {info.descripcion}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer con progreso */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/50">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Progreso</span>
                    <span className="font-medium text-[var(--foreground)]">
                        {estadoSecciones.filter(e => e.completada).length} / {estadoSecciones.length}
                    </span>
                </div>
                <div className="mt-2 h-2 bg-[var(--background)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--chart-2)] transition-all duration-500"
                        style={{
                            width: `${(estadoSecciones.filter(e => e.completada).length / estadoSecciones.length) * 100}%`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
