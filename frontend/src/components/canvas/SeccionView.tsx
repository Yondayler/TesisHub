import { ReactNode } from 'react';

interface SeccionViewProps {
    children: ReactNode;
    titulo?: string;
    editable?: boolean;
}

/**
 * Componente que envuelve el contenido de una sección en un template de hoja A4
 * Similar al estilo de PortadaView para mantener consistencia visual
 */
export function SeccionView({ children, titulo, editable = true }: SeccionViewProps) {
    return (
        <div className="w-full h-full overflow-y-auto bg-gray-100 p-4">
            <div className="w-[210mm] min-h-[297mm] bg-white text-black shadow-lg mx-auto my-4">
                {/* Contenedor principal con márgenes académicos estándar */}
                <div className="px-[2.5cm] py-[3cm] min-h-[297mm]">
                    {/* Título de la sección si se proporciona */}
                    {titulo && (
                        <div className="mb-8 pb-4 border-b border-gray-300">
                            <h1 className="text-2xl font-bold text-center uppercase tracking-wide text-black">
                                {titulo}
                            </h1>
                        </div>
                    )}

                    {/* Contenido de la sección - El editor se renderiza aquí */}
                    <div className="w-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

