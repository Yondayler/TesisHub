import { useState } from 'react';
import { Sparkles, Loader2, ChevronRight, ChevronLeft, User, Mail, GraduationCap, Building2, MapPin, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { canvasService } from '@/services/canvasService';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';

interface ChatCanvasProps {
    onGenerarIndice: (datos: {
        titulo: string;
        descripcion: string;
        carrera: string;
        tipo: string;
        // Datos de portada
        autor: string;
        email: string;
        universidad: string;
        facultad: string;
        ciudad: string;
        tutor?: string;
        nivel?: 'grado_1' | 'grado_2';
    }) => void;
    onGenerarCapitulo: (numeroCapitulo: number) => void;
    generando: boolean;
    indiceGenerado: boolean;
    capitulosDisponibles: number;
    mensajeInterrupcion?: string | null;
    proveedorLLM?: 'gemini' | 'groq'; // Proveedor seleccionado
    onIniciarGeneracion?: () => void; // Callback para cerrar sidebar y mostrar animación
}

export function ChatCanvas({
    onGenerarIndice,
    onGenerarCapitulo,
    generando,
    indiceGenerado,
    capitulosDisponibles,
    mensajeInterrupcion,
    proveedorLLM = 'gemini', // Default a Gemini
    onIniciarGeneracion
}: ChatCanvasProps) {
    const { usuario } = useAuth();
    const [pasoActual, setPasoActual] = useState(0);
    const [generandoTitulo, setGenerandoTitulo] = useState(false);

    // Datos del proyecto
    const [descripcion, setDescripcion] = useState('');
    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState<string>('desarrollo_software');
    const [nivel, setNivel] = useState<'grado_1' | 'grado_2'>('grado_2'); // Por defecto Grado II (Tecnológico)

    // Datos de portada
    const [autor, setAutor] = useState(usuario?.nombre || '');
    const [email, setEmail] = useState('');
    const [universidad, setUniversidad] = useState('Universidad Nacional Experimental Rómulo Gallegos');
    const [facultad, setFacultad] = useState('Facultad de Ciencias de la Ingeniería');
    const [carrera, setCarrera] = useState('');
    const [ciudad, setCiudad] = useState('San Juan de los Morros');
    const [tutor, setTutor] = useState('');

    const pasos = [
        { titulo: '¡Bienvenido!', icono: Sparkles },
        { titulo: 'Sobre ti', icono: User },
        { titulo: 'Tu institución', icono: Building2 },
        { titulo: 'Tu proyecto', icono: GraduationCap },
    ];

    const progreso = ((pasoActual + 1) / pasos.length) * 100;

    const handleGenerarTitulo = async () => {
        if (!descripcion) {
            toast.error('Primero describe tu proyecto');
            return;
        }

        try {
            setGenerandoTitulo(true);
            const tituloGenerado = await canvasService.generarTitulo(descripcion, carrera, proveedorLLM);
            setTitulo(tituloGenerado);
            toast.success('¡Título generado!');
        } catch (error: any) {
            console.error('Error generando título:', error);

            // Detectar error de cuota agotada
            const errorMessage = error.response?.data?.error || error.message || 'Error al generar el título';
            const esErrorCuota = errorMessage.includes('quota') || errorMessage.includes('exceeded') || error.response?.status === 429;

            if (esErrorCuota) {
                toast.error('⚠️ Cuota de API agotada. Has alcanzado el límite de 20 requests/día del tier gratuito. Intenta mañana o usa una nueva API key.');
            } else {
                toast.error(String(errorMessage));
            }
        } finally {
            setGenerandoTitulo(false);
        }
    };

    const handleFinalizar = () => {
        if (!descripcion || !titulo || !carrera || !autor || !email) {
            toast.error('Por favor completa todos los campos requeridos');
            return;
        }

        // Llamar callback para iniciar animación y cerrar sidebar
        if (onIniciarGeneracion) {
            onIniciarGeneracion();
        }

        onGenerarIndice({
            titulo,
            descripcion,
            carrera,
            tipo,
            autor,
            email,
            universidad,
            facultad,
            ciudad,
            tutor: tutor || undefined,
            nivel
        });
    };

    const puedeAvanzar = () => {
        switch (pasoActual) {
            case 0: return true;
            case 1: return autor && email;
            case 2: return universidad && facultad && carrera && ciudad;
            case 3: return descripcion && titulo;
            default: return false;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Alerta de Interrupción */}
            {mensajeInterrupcion && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">Generación Interrumpida</h4>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{mensajeInterrupcion}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            {pasoActual > 0 && !indiceGenerado && (
                <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                            Paso {pasoActual} de {pasos.length - 1}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)]">
                            {Math.round(progreso)}%
                        </span>
                    </div>
                    <Progress value={progreso} className="h-2" />
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Paso 0: Bienvenida */}
                {pasoActual === 0 && !indiceGenerado && (
                    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-700">
                        <div className="text-center space-y-4 max-w-lg">
                            <div className="bg-gradient-to-br from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6 shadow-2xl">
                                <Sparkles className="h-12 w-12 text-white" />
                            </div>

                            <h3 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] bg-clip-text text-transparent">
                                ¡Creemos tu tesis!
                            </h3>

                            <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">
                                Te guiaré paso a paso para crear la estructura perfecta de tu proyecto de grado.
                                Solo tomará unos minutos. 🚀
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-6 text-left">
                                {['Portada profesional', 'Estructura académica', 'Contenido generado por IA', 'Exportación a Word/PDF'].map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--chart-2)] mt-2" />
                                        <span className="text-[var(--muted-foreground)]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={() => setPasoActual(1)}
                            size="lg"
                            className="w-full max-w-sm h-14 rounded-full bg-gradient-to-r from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] text-white hover:opacity-90 shadow-xl transition-all hover:scale-[1.02] font-semibold text-lg"
                        >
                            Comenzar
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                )}

                {/* Paso 1: Datos Personales */}
                {pasoActual === 1 && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right duration-500">
                        <div className="text-center mb-8">
                            <div className="bg-[var(--secondary)] p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                                <User className="h-8 w-8 text-[var(--chart-2)]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--foreground)]">Cuéntanos sobre ti</h3>
                            <p className="text-[var(--muted-foreground)] mt-2">Esta información aparecerá en la portada de tu tesis</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <User className="h-4 w-4" />
                                    Tu nombre completo
                                </label>
                                <Input
                                    value={autor}
                                    onChange={(e) => setAutor(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <Mail className="h-4 w-4" />
                                    Tu correo electrónico
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ej: juan.perez@example.com"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <GraduationCap className="h-4 w-4" />
                                    Tutor académico (opcional)
                                </label>
                                <Input
                                    value={tutor}
                                    onChange={(e) => setTutor(e.target.value)}
                                    placeholder="Ej: Prof. María González"
                                    className="h-12 text-base"
                                />
                                <p className="text-xs text-[var(--muted-foreground)]">Puedes dejarlo en blanco si aún no tienes tutor asignado</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Paso 2: Datos Institucionales */}
                {pasoActual === 2 && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right duration-500">
                        <div className="text-center mb-8">
                            <div className="bg-[var(--secondary)] p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                                <Building2 className="h-8 w-8 text-[var(--chart-2)]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--foreground)]">Tu institución</h3>
                            <p className="text-[var(--muted-foreground)] mt-2">Información de tu universidad y programa</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <Building2 className="h-4 w-4" />
                                    Universidad
                                </label>
                                <Input
                                    value={universidad}
                                    onChange={(e) => setUniversidad(e.target.value)}
                                    placeholder="Nombre de tu universidad"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <GraduationCap className="h-4 w-4" />
                                    Facultad
                                </label>
                                <Input
                                    value={facultad}
                                    onChange={(e) => setFacultad(e.target.value)}
                                    placeholder="Ej: Facultad de Ciencias de la Ingeniería"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <GraduationCap className="h-4 w-4" />
                                    Carrera o Programa
                                </label>
                                <Input
                                    value={carrera}
                                    onChange={(e) => setCarrera(e.target.value)}
                                    placeholder="Ej: Ingeniería en Informática"
                                    className="h-12 text-base"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 text-[var(--foreground)]">
                                    <MapPin className="h-4 w-4" />
                                    Ciudad
                                </label>
                                <Input
                                    value={ciudad}
                                    onChange={(e) => setCiudad(e.target.value)}
                                    placeholder="Ej: San Juan de los Morros"
                                    className="h-12 text-base"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Paso 3: Datos del Proyecto */}
                {pasoActual === 3 && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-right duration-500">
                        <div className="text-center mb-8">
                            <div className="bg-[var(--secondary)] p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                                <Sparkles className="h-8 w-8 text-[var(--chart-2)]" />
                            </div>
                            <h3 className="text-2xl font-bold text-[var(--foreground)]">Tu proyecto de tesis</h3>
                            <p className="text-[var(--muted-foreground)] mt-2">Describe tu investigación</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--foreground)]">
                                    Descripción del proyecto
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Describe brevemente de qué trata tu proyecto de tesis..."
                                    className="w-full min-h-[120px] p-3 border border-[var(--input)] rounded-lg text-base bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
                                />
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    Ejemplo: "Sistema web para la gestión de inventario de una empresa comercial"
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--foreground)]">
                                    Nivel Académico
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setNivel('grado_1')}
                                        className={`p-3 rounded-lg border text-left transition-all ${nivel === 'grado_1'
                                            ? 'border-[var(--chart-2)] bg-[var(--chart-2)]/10 ring-1 ring-[var(--chart-2)]'
                                            : 'border-[var(--input)] hover:bg-[var(--accent)]'
                                            }`}
                                    >
                                        <div className="font-medium text-sm mb-1">Grado I</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">Investigación Clásica (Marco Teórico, Metodología)</div>
                                    </button>
                                    <button
                                        onClick={() => setNivel('grado_2')}
                                        className={`p-3 rounded-lg border text-left transition-all ${nivel === 'grado_2'
                                            ? 'border-[var(--chart-2)] bg-[var(--chart-2)]/10 ring-1 ring-[var(--chart-2)]'
                                            : 'border-[var(--input)] hover:bg-[var(--accent)]'
                                            }`}
                                    >
                                        <div className="font-medium text-sm mb-1">Grado II</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">Proyecto Tecnológico (Diagnóstico, Desarrollo)</div>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--foreground)]">
                                    Tipo de investigación
                                </label>
                                <select
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="w-full h-12 px-3 border border-[var(--input)] rounded-lg text-base bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                >
                                    <option value="desarrollo_software">Desarrollo de Software</option>
                                    <option value="investigacion_campo">Investigación de Campo</option>
                                    <option value="estudio_caso">Estudio de Caso</option>
                                    <option value="revision_literatura">Revisión de Literatura</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-[var(--foreground)]">
                                        Título de la tesis
                                    </label>
                                    <Button
                                        onClick={handleGenerarTitulo}
                                        disabled={!descripcion || generandoTitulo}
                                        variant="outline"
                                        size="sm"
                                        className="h-8"
                                    >
                                        {generandoTitulo ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Generando...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Generar con IA
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <Input
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: Sistema Web de Gestión de Inventario"
                                    className="h-12 text-base"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Vista de generación */}
                {indiceGenerado && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500 fade-in">
                        <div className="bg-[var(--muted)]/50 p-4 rounded-lg border border-[var(--border)]">
                            <h4 className="font-medium text-[var(--foreground)] mb-2">✅ Índice Generado</h4>
                            <p className="text-sm text-[var(--muted-foreground)]">
                                El índice de tu tesis ha sido generado. Ahora puedes generar los capítulos uno por uno.
                            </p>
                        </div>

                        {capitulosDisponibles > 0 && (
                            <div className="bg-[var(--card)] p-4 rounded-lg border border-[var(--border)] space-y-2 shadow-sm">
                                <h4 className="font-medium mb-2 text-[var(--foreground)]">Generar Capítulos</h4>
                                {Array.from({ length: capitulosDisponibles }, (_, i) => i + 1).map((num) => (
                                    <Button
                                        key={num}
                                        onClick={() => onGenerarCapitulo(num)}
                                        disabled={generando}
                                        variant="outline"
                                        className="w-full justify-start hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors"
                                    >
                                        {generando ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4 mr-2 text-[var(--chart-2)]" />
                                        )}
                                        Generar Capítulo {num}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {generando && !indiceGenerado && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--chart-2)]" />
                            <span className="text-sm font-medium text-[var(--muted-foreground)]">Generando estructura de la tesis...</span>
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-4 border border-[var(--border)] rounded-lg bg-[var(--card)] space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            {pasoActual > 0 && pasoActual < 4 && !indiceGenerado && (
                <div className="p-4 border-t border-[var(--border)] flex gap-3">
                    <Button
                        onClick={() => setPasoActual(pasoActual - 1)}
                        variant="outline"
                        className="flex-1"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Atrás
                    </Button>
                    {pasoActual < 3 ? (
                        <Button
                            onClick={() => setPasoActual(pasoActual + 1)}
                            disabled={!puedeAvanzar()}
                            className="flex-1 bg-gradient-to-r from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] text-white"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinalizar}
                            disabled={!puedeAvanzar() || generando}
                            className="flex-1 bg-gradient-to-r from-[var(--chart-1)] via-[var(--chart-2)] to-[var(--chart-3)] text-white"
                        >
                            {generando ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generar Tesis
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
