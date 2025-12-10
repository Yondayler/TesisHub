import { Portada } from '@/types/canvas';

interface PortadaViewProps {
    portada: Portada;
    logoUrl?: string;
}

export function PortadaView({ portada, logoUrl }: PortadaViewProps) {
    return (
        <div className="w-[210mm] h-[297mm] bg-white text-black flex flex-col items-center justify-between px-16 py-12 relative shadow-lg mx-auto">
            {/* Logo de la Universidad */}
            <div className="flex flex-col items-center pt-8">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt="Logo Universidad"
                        className="h-48 w-auto object-contain"
                    />
                ) : (
                    <div className="h-48 w-auto flex items-center justify-center">
                        <span className="text-gray-400 text-xs">[Logo Universidad]</span>
                    </div>
                )}
            </div>

            {/* Contenido Central */}
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl px-8">
                {/* Título del Proyecto */}
                <h1 className="text-xl font-bold mb-3 leading-tight">
                    {portada.titulo}
                </h1>

                {/* Subtítulo/Tipo de Proyecto */}
                <p className="text-base font-bold mb-16">
                    Proyecto Grado II
                </p>

                {/* Información del Autor */}
                <div className="space-y-1 text-base leading-relaxed">
                    <p className="font-normal">{portada.autor}</p>
                    {portada.email && <p className="font-normal text-sm">{portada.email}</p>}
                    <p className="font-normal mt-3">{portada.carrera}</p>
                    <p className="font-normal">{portada.facultad}</p>
                </div>
            </div>

            {/* Pie de Página */}
            <div className="text-center pb-8">
                <p className="text-base font-normal">
                    {portada.ciudad} - {portada.fecha}
                </p>
            </div>

            {/* Borde de página eliminado por solicitud */}
            {/* <div className="absolute inset-0 border-[3px] border-black pointer-events-none" /> */}
        </div>
    );
}

// Componente editable para la portada
interface PortadaEditorProps {
    portada: Portada;
    onChange: (portada: Portada) => void;
    logoUrl?: string;
}

export function PortadaEditor({ portada, onChange, logoUrl }: PortadaEditorProps) {
    const handleChange = (field: keyof Portada, value: string) => {
        onChange({
            ...portada,
            [field]: value
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-8 space-y-6 bg-[var(--card)] rounded-lg">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Configurar Portada</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Universidad */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Universidad
                    </label>
                    <input
                        type="text"
                        value={portada.universidad}
                        onChange={(e) => handleChange('universidad', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Universidad Nacional Experimental Rómulo Gallegos"
                    />
                </div>

                {/* Facultad */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Facultad
                    </label>
                    <input
                        type="text"
                        value={portada.facultad}
                        onChange={(e) => handleChange('facultad', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Facultad de Ciencias de la Ingeniería"
                    />
                </div>

                {/* Carrera */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Carrera/Programa
                    </label>
                    <input
                        type="text"
                        value={portada.carrera}
                        onChange={(e) => handleChange('carrera', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Programa de Ingeniería en Informática"
                    />
                </div>

                {/* Título */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Título del Proyecto
                    </label>
                    <textarea
                        value={portada.titulo}
                        onChange={(e) => handleChange('titulo', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Título de la tesis"
                    />
                </div>

                {/* Autor */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Autor
                    </label>
                    <input
                        type="text"
                        value={portada.autor}
                        onChange={(e) => handleChange('autor', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Nombre completo"
                    />
                </div>

                {/* Tutor */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Tutor (opcional)
                    </label>
                    <input
                        type="text"
                        value={portada.tutor || ''}
                        onChange={(e) => handleChange('tutor', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Nombre del tutor"
                    />
                </div>

                {/* Ciudad */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Ciudad
                    </label>
                    <input
                        type="text"
                        value={portada.ciudad}
                        onChange={(e) => handleChange('ciudad', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="San Juan de los Morros"
                    />
                </div>

                {/* Fecha */}
                <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Fecha
                    </label>
                    <input
                        type="text"
                        value={portada.fecha}
                        onChange={(e) => handleChange('fecha', e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)]"
                        placeholder="Febrero 2025"
                    />
                </div>
            </div>

            {/* Vista Previa */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Vista Previa</h3>
                <div className="border border-[var(--border)] rounded-lg overflow-hidden shadow-lg transform scale-50 origin-top">
                    <PortadaView portada={portada} logoUrl={logoUrl} />
                </div>
            </div>
        </div>
    );
}
