import { cn } from '@/lib/utils';

interface IndiceViewProps {
    nivel: 'grado_1' | 'grado_2';
}

export function IndiceView({ nivel }: IndiceViewProps) {
    return (
        <div className="w-[210mm] min-h-[297mm] bg-white text-black flex flex-col px-16 py-12 relative shadow-lg mx-auto my-8">
            {/* Título */}
            <div className="text-center mb-12">
                <h2 className="text-xl font-bold uppercase">Índice General</h2>
            </div>

            {/* Contenido */}
            <div className="flex-1 text-base leading-relaxed font-normal">
                {nivel === 'grado_1' ? (
                    <IndiceGrado1 />
                ) : (
                    <IndiceGrado2 />
                )}
            </div>
        </div>
    );
}

function IndiceGrado1() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between font-bold">
                <span>RESUMEN</span>
                <span></span>
            </div>

            <div className="space-y-2">
                <div className="font-bold">CAPÍTULO I: EL PROBLEMA</div>
                <div className="pl-6 flex justify-between"><span>1.1 Planteamiento del Problema</span></div>
                <div className="pl-6 flex justify-between"><span>1.2 Formulación del Problema</span></div>
                <div className="pl-6 flex justify-between"><span>1.3 Objetivos de la Investigación</span></div>
                <div className="pl-10 flex justify-between"><span>1.3.1 Objetivo General</span></div>
                <div className="pl-10 flex justify-between"><span>1.3.2 Objetivos Específicos</span></div>
                <div className="pl-6 flex justify-between"><span>1.4 Justificación de la Investigación</span></div>
                <div className="pl-6 flex justify-between"><span>1.5 Alcance y Limitaciones</span></div>
            </div>

            <div className="space-y-2">
                <div className="font-bold">CAPÍTULO II: MARCO TEÓRICO</div>
                <div className="pl-6 flex justify-between"><span>2.1 Antecedentes de la Investigación</span></div>
                <div className="pl-6 flex justify-between"><span>2.2 Bases Teóricas</span></div>
                <div className="pl-6 flex justify-between"><span>2.3 Bases Legales</span></div>
                <div className="pl-6 flex justify-between"><span>2.4 Definición de Términos Básicos</span></div>
            </div>

            <div className="space-y-2">
                <div className="font-bold">CAPÍTULO III: MARCO METODOLÓGICO</div>
                <div className="pl-6 flex justify-between"><span>3.1 Tipo y Diseño de la Investigación</span></div>
                <div className="pl-6 flex justify-between"><span>3.2 Población y Muestra</span></div>
                <div className="pl-6 flex justify-between"><span>3.3 Técnicas e Instrumentos de Recolección de Datos</span></div>
                <div className="pl-6 flex justify-between"><span>3.4 Validez y Confiabilidad</span></div>
                <div className="pl-6 flex justify-between"><span>3.5 Técnicas de Análisis de Datos</span></div>
            </div>

            <div className="space-y-2">
                <div className="font-bold">CAPÍTULO IV: RESULTADOS</div>
                <div className="pl-6 flex justify-between"><span>4.1 Presentación y Análisis de los Resultados</span></div>
                <div className="pl-6 flex justify-between"><span>4.2 Discusión de los Resultados</span></div>
            </div>

            <div className="space-y-2">
                <div className="font-bold">CAPÍTULO V: CONCLUSIONES Y RECOMENDACIONES</div>
                <div className="pl-6 flex justify-between"><span>5.1 Conclusiones</span></div>
                <div className="pl-6 flex justify-between"><span>5.2 Recomendaciones</span></div>
            </div>

            <div className="font-bold">REFERENCIAS BIBLIOGRÁFICAS</div>
        </div>
    );
}

function IndiceGrado2() {
    // Helper para filas de tabla
    const Row = ({ label, page, bold = false, indent = 0 }: { label: string, page: string, bold?: boolean, indent?: number }) => (
        <div className={cn("flex justify-between items-baseline py-0.5", bold && "font-bold")}>
            <span style={{ paddingLeft: `${indent * 20}px` }}>{label}</span>
            <span>{page}</span>
        </div>
    );

    return (
        <div className="w-full">
            {/* 3. RESUMEN */}
            <Row label="3. RESUMEN" page="2" bold />

            {/* 4. Diagnóstico Situacional */}
            <div className="mt-4">
                <Row label="4. Diagnóstico Situacional" page="5" bold />
                <Row label="4.1 Descripción del Contexto de la Situación Problemática Planteada" page="5" indent={1} />
                <Row label="4.2 Justificación del Problema" page="5" indent={1} />
                <Row label="4.3 Objetivos del Proyecto" page="5" indent={1} />
                <Row label="4.4 Procesos que van a Automatizar" page="5" indent={1} />
            </div>

            {/* 5. Herramientas de Desarrollo */}
            <div className="mt-4">
                <Row label="5. Determinación, Instalación y Configuración de las Herramientas de Desarrollo" page="6" bold />
                <Row label="5.1 Plataforma de Desarrollo" page="6" indent={1} />
                <Row label="5.2 Arquitectura del Sistema de Información" page="6" indent={1} />
                <Row label="5.3 Selección del Entorno del Sistema de Información" page="6" indent={1} />
                <Row label="5.4 Metodología para el Desarrollo del Sistema de Información" page="6" indent={1} />
            </div>

            {/* 6. Desarrollo de la Aplicación */}
            <div className="mt-4">
                <Row label="6. Desarrollo de la Aplicación" page="6" bold />
                <Row label="6.1 Fase de Planificación" page="6" indent={1} />
                <Row label="6.1.1 Descripción" page="6" indent={2} />
                <Row label="6.1.2 Requerimientos Funcionales del Proyecto" page="6" indent={2} />
                <Row label="6.1.3 Requerimientos No Funcionales del Sistema de Información" page="7" indent={2} />
                <Row label="6.1.4 Restricciones" page="7" indent={2} />
                <Row label="6.2 Fase de Diseño" page="7" indent={1} />
                <Row label="6.2.1 Diagrama de acuerdo a la Metodología Estudio" page="7" indent={2} />
                <Row label="6.2.2 Diagrama de Clases" page="9" indent={2} />
                <Row label="6.2.3 Diagrama de Secuencia" page="10" indent={2} />
                <Row label="6.2.4 Diagrama Arquitectónico" page="10" indent={2} />
                <Row label="6.2.5 Diagrama de Navegación" page="11" indent={2} />
                <Row label="6.2.6 Diseño Bocetos del Sistema de Información" page="12" indent={2} />
                <Row label="6.3 Fase de Codificación (Programación)" page="14" indent={1} />
                <Row label="6.3.1 Requerimientos de Desarrollo" page="14" indent={2} />
                <Row label="6.3.2 Desarrollo de los Módulos del Sistema" page="14" indent={2} />
            </div>

            {/* 7. Fase de Pruebas */}
            <div className="mt-4">
                <Row label="7. Fase de Pruebas" page="16" bold />
                <Row label="7.1 Elaboración y Ejecución del Plan de Pruebas" page="16" indent={1} />
                <Row label="7.2 Análisis de Resultados" page="16" indent={1} />
            </div>

            {/* 8. Conclusiones */}
            <div className="mt-4">
                <Row label="8. Conclusiones" page="17" bold />
            </div>

            {/* 9. Recomendaciones */}
            <div className="mt-4">
                <Row label="9. Recomendaciones" page="17" bold />
            </div>

            {/* 10. Referencias */}
            <div className="mt-4">
                <Row label="10. Referencias" page="18" bold />
            </div>
        </div>
    );
}
