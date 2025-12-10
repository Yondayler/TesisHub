import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

interface AnimacionInicioCanvasProps {
    mostrar: boolean;
    onComplete: () => void;
}

export function AnimacionInicioCanvas({ mostrar, onComplete }: AnimacionInicioCanvasProps) {
    const [progreso, setProgreso] = useState(0);

    useEffect(() => {
        if (!mostrar) return;

        // Animación de progreso suave
        const duracion = 1500; // 1.5 segundos
        const intervalo = 20; // Actualizar cada 20ms
        const incremento = (100 / duracion) * intervalo;

        const timer = setInterval(() => {
            setProgreso(prev => {
                const nuevo = prev + incremento;
                if (nuevo >= 100) {
                    clearInterval(timer);
                    setTimeout(onComplete, 200);
                    return 100;
                }
                return nuevo;
            });
        }, intervalo);

        return () => clearInterval(timer);
    }, [mostrar, onComplete]);

    if (!mostrar) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-950">
            {/* Contenedor central minimalista */}
            <div className="flex flex-col items-center gap-6 max-w-md px-8">
                {/* Icono simple */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 p-4 rounded-2xl shadow-lg">
                        <FileText className="h-8 w-8 text-white" strokeWidth={2} />
                    </div>
                </div>

                {/* Texto */}
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Preparando Canvas
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Inicializando editor académico
                    </p>
                </div>

                {/* Barra de progreso minimalista */}
                <div className="w-full max-w-xs">
                    <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gray-700 dark:bg-gray-300 transition-all duration-200 ease-out"
                            style={{ width: `${progreso}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
