import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { canvasService } from '@/services/canvasService';
import { CanvasHeader } from './CanvasHeader';
import { ChatCanvas } from './ChatCanvas';
import { TesisEditorWYSIWYG } from './TesisEditorWYSIWYG';
import { PortadaEditable } from './PortadaEditable';
import { SidebarCanvas, TesisListItem } from './SidebarCanvas';
import { SeccionesAcademicas } from './SeccionesAcademicas';
import { SeccionView } from './SeccionView';
import { AnimacionInicioCanvas } from './AnimacionInicioCanvas';
import type {
    Portada,
    SeccionAcademica,
    EstadoSeccion
} from '@/types/canvas';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Editor } from '@tiptap/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CanvasTesis() {
    const { } = useAuth();
    const navigate = useNavigate();

    // Estados de UI
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [seccionActual, setSeccionActual] = useState<SeccionAcademica>('portada');

    // Estados de contenido
    const [portada, setPortada] = useState<Portada | null>(null);
    const [tipoTesis, setTipoTesis] = useState<string>('desarrollo_software');
    const [contenidoSecciones, setContenidoSecciones] = useState<Record<SeccionAcademica, string>>({
        portada: '',
        indice: '',
        resumen: '',
        introduccion: '',
        diagnostico: '',
        herramientas: '',
        desarrollo: '',
        pruebas: '',
        marco_teorico: '',
        metodologia: '',
        resultados: '',
        conclusiones: '',
        recomendaciones: '',
        referencias: ''
    });

    const [estadoSecciones, setEstadoSecciones] = useState<EstadoSeccion[]>([
        { seccion: 'portada', completada: false, generando: false, paginas: 1 },
        { seccion: 'indice', completada: false, generando: false, paginas: 0 },
        { seccion: 'resumen', completada: false, generando: false, paginas: 0 },
        { seccion: 'introduccion', completada: false, generando: false, paginas: 0 },
        { seccion: 'diagnostico', completada: false, generando: false, paginas: 0 },
        { seccion: 'herramientas', completada: false, generando: false, paginas: 0 },
        { seccion: 'desarrollo', completada: false, generando: false, paginas: 0 },
        { seccion: 'pruebas', completada: false, generando: false, paginas: 0 },
        { seccion: 'marco_teorico', completada: false, generando: false, paginas: 0 },
        { seccion: 'metodologia', completada: false, generando: false, paginas: 0 },
        { seccion: 'resultados', completada: false, generando: false, paginas: 0 },
        { seccion: 'conclusiones', completada: false, generando: false, paginas: 0 },
        { seccion: 'recomendaciones', completada: false, generando: false, paginas: 0 },
        { seccion: 'referencias', completada: false, generando: false, paginas: 0 }
    ]);

    // Estados de historial
    const [tesisActualId, setTesisActualId] = useState<number | null>(null);
    const [tesisList, setTesisList] = useState<TesisListItem[]>([]);
    const [loadingTesis, setLoadingTesis] = useState(false);

    // Estados de generación
    const [generando, setGenerando] = useState(false);
    const [wizardCompletado, setWizardCompletado] = useState(false);
    // Leer preferencia de proveedor de localStorage (default: gemini)
    const [proveedorLLM, setProveedorLLM] = useState<'gemini' | 'groq'>(() => {
        const saved = localStorage.getItem('canvas-proveedor-llm');
        return (saved === 'groq' || saved === 'gemini') ? saved : 'gemini';
    });
    const [mostrarAnimacionInicio, setMostrarAnimacionInicio] = useState(false);

    // Estado del editor
    const [editor, setEditor] = useState<Editor | null>(null);

    // Estados de exportación
    const [exportando, setExportando] = useState(false);

    // Estado de error de sobrecarga
    const [errorSobrecarga, setErrorSobrecarga] = useState(false);
    const [exportandoPdf, setExportandoPdf] = useState(false);

    // Cargar lista de tesis al montar
    useEffect(() => {
        cargarListaTesis();
    }, []);

    // Guardar preferencia de proveedor en localStorage cuando cambie
    useEffect(() => {
        localStorage.setItem('canvas-proveedor-llm', proveedorLLM);
        console.log(`💾 [CANVAS] Preferencia de proveedor guardada: ${proveedorLLM}`);
    }, [proveedorLLM]);

    const cargarListaTesis = async () => {
        try {
            setLoadingTesis(true);
            const lista = await canvasService.listarTesis();
            setTesisList(lista);
        } catch (error) {
            console.error('Error al cargar lista de tesis:', error);
        } finally {
            setLoadingTesis(false);
        }
    };

    /**
     * Filtra las secciones según el nivel de la tesis
     */
    const getSeccionesFiltradas = (): EstadoSeccion[] => {
        const nivel = portada?.nivel || 'grado_2';

        if (nivel === 'grado_2') {
            // Grado II: Solo secciones tecnológicas
            const seccionesGrado2: SeccionAcademica[] = [
                'portada',
                'indice',
                'resumen',
                'diagnostico',
                'herramientas',
                'desarrollo',
                'pruebas',
                'conclusiones',
                'recomendaciones',
                'referencias'
            ];
            return estadoSecciones.filter(e => seccionesGrado2.includes(e.seccion));
        } else {
            // Grado I: Secciones académicas tradicionales
            const seccionesGrado1: SeccionAcademica[] = [
                'portada',
                'indice',
                'resumen',
                'introduccion',
                'marco_teorico',
                'metodologia',
                'resultados',
                'conclusiones',
                'recomendaciones',
                'referencias'
            ];
            return estadoSecciones.filter(e => seccionesGrado1.includes(e.seccion));
        }
    };

    const guardarProgreso = async (
        portadaOverride?: Portada,
        contenidoOverride?: Record<SeccionAcademica, string>,
        idOverride?: number,
        tipoOverride?: string
    ): Promise<number | null> => {
        const p = portadaOverride || portada;
        const c = contenidoOverride || contenidoSecciones;
        const currentId = idOverride || tesisActualId;
        const t = tipoOverride || tipoTesis;

        if (!p) return null;

        // Validar campos requeridos antes de guardar
        if (!p.titulo || !p.titulo.trim()) {
            console.error('No se puede guardar: el título es requerido');
            toast.error('El título es requerido para guardar');
            return null;
        }
        if (!p.carrera || !p.carrera.trim()) {
            console.error('No se puede guardar: la carrera es requerida');
            toast.error('La carrera es requerida para guardar');
            return null;
        }
        if (!t || !['desarrollo_software', 'investigacion_campo', 'estudio_caso', 'revision_literatura'].includes(t)) {
            console.error('No se puede guardar: el tipo es inválido', t);
            toast.error('El tipo de tesis es inválido');
            return null;
        }

        try {
            // Empaquetamos todo en el campo 'capitulos' como JSON string
            const capitulosData = {
                portada: p,
                secciones: c
            };

            const datosTesis = {
                titulo: p.titulo.trim(),
                descripcion: 'Tesis generada automáticamente',
                carrera: p.carrera.trim(),
                tipo: t,
                indice: (c.indice || '').trim(), // Asegurar que siempre sea un string
                capitulos: JSON.stringify(capitulosData) // Stringify para cumplir validación del backend
            };

            let savedId = currentId;

            if (currentId) {
                await canvasService.actualizarTesis(currentId, datosTesis);
            } else {
                savedId = await canvasService.guardarTesis(datosTesis);
                setTesisActualId(savedId);
            }

            await cargarListaTesis();
            return savedId;
        } catch (error: any) {
            console.error('Error al guardar progreso:', error);

            // Mostrar mensaje de error más detallado
            let mensajeError = 'Error al guardar el progreso';

            if (error.response?.status === 413) {
                mensajeError = 'El contenido es demasiado grande. Intenta reducir el tamaño de las secciones.';
            } else if (error.response?.data?.error) {
                mensajeError = String(error.response.data.error);
            } else if (error.response?.data?.errors) {
                const errores = error.response.data.errors;
                mensajeError = Array.isArray(errores)
                    ? errores.map((e: any) => e.message || e.msg).join(', ')
                    : 'Error de validación';
            } else if (error.message) {
                mensajeError = String(error.message);
            }

            toast.error(mensajeError);
            return null;
        }
    };

    // Handler para iniciar la generación con animación
    const handleIniciarGeneracion = () => {
        // Cerrar sidebar con animación
        setSidebarOpen(false);

        // Mostrar animación de inicio
        setMostrarAnimacionInicio(true);
    };

    const handleGenerarTesisCompleta = async (datosWizard: any) => {
        try {
            setGenerando(true);
            setWizardCompletado(true);

            // 1. Crear portada instantáneamente
            const nuevaPortada: Portada = {
                universidad: datosWizard.universidad,
                facultad: datosWizard.facultad,
                carrera: datosWizard.carrera,
                titulo: datosWizard.titulo,
                autor: datosWizard.autor,
                email: datosWizard.email,
                tutor: datosWizard.tutor,
                ciudad: datosWizard.ciudad,
                fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
                descripcion: datosWizard.descripcion,
                tipo: datosWizard.tipo
            };
            setPortada(nuevaPortada);
            setTipoTesis(datosWizard.tipo); // Guardar el tipo seleccionado
            marcarSeccionCompletada('portada');
            setSeccionActual('portada');

            // Guardar inmediatamente para crear el registro
            const contenidoInicial = { ...contenidoSecciones };
            // Pasamos el tipo explícitamente para evitar race conditions con el estado
            const idTesis = await guardarProgreso(nuevaPortada, contenidoInicial, undefined, datosWizard.tipo);

            if (idTesis) {
                setTesisActualId(idTesis);
                toast.success('Tesis creada y guardada');
            }

            // Contexto para generación
            const contexto = {
                titulo: datosWizard.titulo,
                descripcion: datosWizard.descripcion,
                carrera: datosWizard.carrera,
                tipo: datosWizard.tipo,
                nivel: datosWizard.nivel || 'grado_2', // Default a grado 2 si no viene
                provider: proveedorLLM // Pasar el proveedor seleccionado
            };
            setPortada(nuevaPortada);
            setTipoTesis(datosWizard.tipo); // Guardar el tipo seleccionado

            // Definir estructura según el nivel
            const esGrado2 = nuevaPortada.nivel === 'grado_2';

            const estructura = {
                capitulos: esGrado2 ? [
                    { numero: 1, titulo: 'Introducción' },
                    { numero: 2, titulo: 'Diagnóstico Situacional' },
                    { numero: 3, titulo: 'Herramientas de Desarrollo' },
                    { numero: 4, titulo: 'Desarrollo del Sistema' },
                    { numero: 5, titulo: 'Fase de Pruebas' },
                    { numero: 6, titulo: 'Conclusiones y Recomendaciones' }
                ] : [
                    { numero: 1, titulo: 'Introducción' },
                    { numero: 2, titulo: 'Marco Teórico' },
                    { numero: 3, titulo: 'Metodología' },
                    { numero: 4, titulo: 'Resultados' },
                    { numero: 5, titulo: 'Conclusiones y Recomendaciones' }
                ]
            };

            // 2. Generar tesis completa en una sola petición
            let buffer = '';
            let wordBuffer = ''; // Buffer para acumular palabras completas
            let seccionActualGenerando: string | null = null;
            let contenidoLocal = { ...contenidoInicial };

            // Marcar todas las secciones como pendientes, EXCEPTO la portada que ya está completada
            setEstadoSecciones(prev => prev.map(e =>
                e.seccion === 'portada'
                    ? { ...e, completada: true, generando: false } // Mantener portada completada
                    : { ...e, generando: false, completada: false } // Resetear las demás
            ));

            await new Promise<void>((resolve, reject) => {
                canvasService.generarTesisCompletaStream(
                    contexto,
                    estructura,
                    (chunk) => {
                        // SOLUCIÓN ESPECÍFICA PARA GROQ:
                        // Groq envía chunks más pequeños y rápidos, el buffer de palabras
                        // causa fragmentación visual. Para Groq, procesamos chunks directamente.
                        // Para Gemini, usamos el buffer de palabras para mejor experiencia.

                        if (proveedorLLM === 'groq') {
                            // Groq: Sin buffer, procesar inmediatamente
                            buffer += chunk;
                        } else {
                            // Gemini: Con buffer de palabras completas
                            // Agregar chunk al buffer de palabras
                            wordBuffer += chunk;

                            // Buscar el último delimitador de palabra (espacio, punto, coma, etc.)
                            const delimitadores = /[\s.,;:!?)\]}\n]/;
                            let ultimoDelimitador = -1;

                            for (let i = wordBuffer.length - 1; i >= 0; i--) {
                                if (delimitadores.test(wordBuffer[i])) {
                                    ultimoDelimitador = i;
                                    break;
                                }
                            }

                            // Si encontramos un delimitador, procesar hasta ahí
                            if (ultimoDelimitador > 0) {
                                const textoCompleto = wordBuffer.substring(0, ultimoDelimitador + 1);
                                wordBuffer = wordBuffer.substring(ultimoDelimitador + 1); // Guardar resto
                                buffer += textoCompleto;
                            } else if (wordBuffer.length > 100) {
                                // Si el buffer es muy largo sin delimitadores, forzar flush
                                buffer += wordBuffer;
                                wordBuffer = '';
                            } else {
                                // No hacer nada, esperar más texto
                                return;
                            }
                        }

                        // Buscar marcadores de sección y error
                        const markerRegex = /---SECCION:([a-z_]+)---|---ERROR:([a-z_]+)---/g;
                        let match;

                        // Procesar todos los marcadores encontrados
                        while ((match = markerRegex.exec(buffer)) !== null) {
                            const [fullMatch, nombreSeccion, nombreSeccionError] = match;
                            const index = match.index;

                            // Detectar marcador de error
                            if (nombreSeccionError) {
                                // Extraer mensaje de error (siguiente línea después del marcador)
                                const restBuffer = buffer.substring(index + fullMatch.length);
                                const lineEnd = restBuffer.indexOf('\n');
                                const mensajeError = lineEnd > 0 ? restBuffer.substring(0, lineEnd).trim() : 'Error desconocido';

                                // Marcar sección como fallida
                                setEstadoSecciones(prev => prev.map(e =>
                                    e.seccion === nombreSeccionError
                                        ? { ...e, generando: false, completada: false, error: true, mensajeError }
                                        : e
                                ));

                                console.error(`❌ [FRONTEND] Sección ${nombreSeccionError} falló: ${mensajeError}`);

                                buffer = buffer.substring(index + fullMatch.length);
                                markerRegex.lastIndex = 0;
                                continue;
                            }

                            // Texto antes del marcador pertenece a la sección anterior
                            if (index > 0 && seccionActualGenerando) {
                                const contenidoPrevio = buffer.substring(0, index);
                                const seccionKey = seccionActualGenerando as SeccionAcademica;

                                contenidoLocal[seccionKey] = (contenidoLocal[seccionKey] || '') + contenidoPrevio;

                                setContenidoSecciones(prev => ({
                                    ...prev,
                                    [seccionKey]: (prev[seccionKey] || '') + contenidoPrevio
                                }));

                                // Solo marcar como completada si tiene contenido real (no vacío)
                                const tieneContenido = contenidoPrevio.trim().length > 0;
                                if (tieneContenido) {
                                    // Marcar anterior como completada Y quitar estado generando
                                    setEstadoSecciones(prev => prev.map(e =>
                                        e.seccion === seccionKey
                                            ? { ...e, generando: false, completada: true, error: false }
                                            : e
                                    ));
                                } else {
                                    // Si no tiene contenido, marcar como error
                                    setEstadoSecciones(prev => prev.map(e =>
                                        e.seccion === seccionKey
                                            ? { ...e, generando: false, completada: false, error: true, mensajeError: 'Contenido vacío' }
                                            : e
                                    ));
                                }

                                // Auto-guardar progreso parcial
                                if (idTesis) {
                                    guardarProgreso(nuevaPortada, contenidoLocal, idTesis, datosWizard.tipo);
                                }
                            }

                            // Cambiar a nueva sección
                            seccionActualGenerando = nombreSeccion;
                            setSeccionActual(nombreSeccion as SeccionAcademica);

                            // Marcar nueva como generando (excepto índice que es estático)
                            if (nombreSeccion === 'indice') {
                                // Índice es estático, marcarlo como completado inmediatamente
                                setEstadoSecciones(prev => prev.map(e =>
                                    e.seccion === nombreSeccion ? { ...e, generando: false, completada: true, error: false } : e
                                ));
                            } else {
                                // Otras secciones se marcan como generando
                                setEstadoSecciones(prev => prev.map(e =>
                                    e.seccion === nombreSeccion ? { ...e, generando: true, error: false } : e
                                ));
                            }

                            // Eliminar lo procesado del buffer (incluyendo el marcador)
                            buffer = buffer.substring(index + fullMatch.length);
                            markerRegex.lastIndex = 0; // Reiniciar regex para el nuevo buffer
                        }

                        // Si hay una sección activa y el buffer no parece tener un marcador parcial
                        if (seccionActualGenerando && buffer.length > 0) {
                            // Verificar si el final del buffer podría ser el inicio de un marcador
                            if (!buffer.endsWith('-') && !buffer.endsWith('---') && !buffer.includes('---SECCION')) {
                                const seccionKey = seccionActualGenerando as SeccionAcademica;
                                contenidoLocal[seccionKey] = (contenidoLocal[seccionKey] || '') + buffer;

                                setContenidoSecciones(prev => ({
                                    ...prev,
                                    [seccionKey]: (prev[seccionKey] || '') + buffer
                                }));
                                buffer = '';
                            }
                        }
                    },
                    () => {
                        // Vaciar wordBuffer si queda algo
                        if (wordBuffer.length > 0) {
                            buffer += wordBuffer;
                            wordBuffer = '';
                        }

                        // Completado final
                        if (seccionActualGenerando && buffer.length > 0) {
                            const seccionKey = seccionActualGenerando as SeccionAcademica;
                            contenidoLocal[seccionKey] = (contenidoLocal[seccionKey] || '') + buffer;

                            setContenidoSecciones(prev => ({
                                ...prev,
                                [seccionKey]: (prev[seccionKey] || '') + buffer
                            }));

                            // Marcar última sección como completada
                            setEstadoSecciones(prev => prev.map(e =>
                                e.seccion === seccionKey ? { ...e, generando: false, completada: true, error: false } : e
                            ));
                        }
                        toast.success('¡Tesis completa generada!');

                        // CRÍTICO: Sincronizar contenidoSecciones con contenidoLocal antes de guardar
                        setContenidoSecciones(contenidoLocal);

                        if (idTesis) {
                            console.log('💾 [DEBUG GUARDADO FINAL] Guardando contenido final:', {
                                keys: Object.keys(contenidoLocal),
                                resumenLength: contenidoLocal.resumen?.length || 0
                            });
                            guardarProgreso(nuevaPortada, contenidoLocal, idTesis, datosWizard.tipo);
                        }
                        resolve(); // Resolver la promesa al completar
                    },
                    (error) => {
                        console.error('Error en el stream de generación:', error);

                        // Detectar error de sobrecarga (503)
                        const errorStr = typeof error === 'string' ? error : ((error as any)?.message || (error as any)?.toString() || '');
                        const isSobrecarga = errorStr.includes('overloaded') ||
                            errorStr.includes('503') ||
                            errorStr.includes('UNAVAILABLE');

                        if (isSobrecarga) {
                            setErrorSobrecarga(true);
                            toast.error('Modelo sobrecargado - Generación detenida');
                        } else {
                            toast.error('Error al generar la tesis');
                        }

                        reject(error); // Rechazar la promesa en caso de error
                    }
                );
            });

        } catch (error: any) {
            console.error('Error al generar tesis:', error);
            toast.error(error.message || 'Error al generar la tesis');
        } finally {
            setGenerando(false);
        }
    };

    const marcarSeccionCompletada = (seccion: SeccionAcademica) => {
        setEstadoSecciones(prev => prev.map(e =>
            e.seccion === seccion
                ? { ...e, completada: true, generando: false, paginas: e.paginas || 1 }
                : e
        ));
    };

    const handleSeleccionarTesis = async (id: number) => {
        try {
            setLoadingTesis(true);
            const tesis = await canvasService.obtenerTesis(id);

            setTesisActualId(id);

            // Verificar si fue interrumpida previamente
            const wasInterrupted = localStorage.getItem(`interrupted_${id}`);
            if (wasInterrupted) {
                setMensajeInterrupcion("La generación de tesis ha sido interrumpida. Puedes continuar desde donde quedaste.");
                // Limpiar la marca
                localStorage.removeItem(`interrupted_${id}`);
            } else {
                setMensajeInterrupcion(null);
            }

            // Intentar parsear el campo capitulos que contiene todo
            let datosGuardados: any = {};
            try {
                if (typeof tesis.capitulos === 'string') {
                    // Si viene como string JSON (lo normal desde el backend)
                    datosGuardados = JSON.parse(tesis.capitulos);
                } else {
                    // Si ya viene parseado
                    datosGuardados = tesis.capitulos || {};
                }
            } catch (e) {
                console.error('Error al parsear capitulos:', e);
            }

            // Cargar portada
            if (datosGuardados.portada) {
                setPortada(datosGuardados.portada);
            }

            // Cargar contenido
            console.log('🔍 [DEBUG CARGA] datosGuardados:', {
                tienePortada: !!datosGuardados.portada,
                tieneSecciones: !!datosGuardados.secciones,
                seccionesKeys: datosGuardados.secciones ? Object.keys(datosGuardados.secciones) : [],
                resumenLength: datosGuardados.secciones?.resumen?.length || 0
            });

            if (datosGuardados.secciones) {
                setContenidoSecciones(datosGuardados.secciones);
                console.log('✅ [DEBUG CARGA] Contenido cargado en estado');
            } else {
                // Fallback para formato antiguo o vacío
                console.log('⚠️ [DEBUG CARGA] No hay secciones guardadas, usando vacío');
                setContenidoSecciones({
                    portada: '',
                    indice: tesis.indice || '',
                    resumen: '',
                    introduccion: '',
                    diagnostico: '',
                    herramientas: '',
                    desarrollo: '',
                    pruebas: '',
                    marco_teorico: '',
                    metodologia: '',
                    resultados: '',
                    conclusiones: '',
                    recomendaciones: '',
                    referencias: ''
                });
            }

            // Actualizar estado de secciones
            setEstadoSecciones(prev => prev.map(e => ({
                ...e,
                completada: true, // Asumimos completadas al cargar
                generando: false,
                paginas: 1 // Estimado
            })));

            setWizardCompletado(true);
            setSeccionActual('portada');

            toast.success('Tesis cargada correctamente');
        } catch (error) {
            console.error('Error al cargar tesis:', error);
            toast.error('Error al cargar la tesis');
        } finally {
            setLoadingTesis(false);
        }
    };



    const handleEliminarTesis = async (id: number) => {
        try {
            await canvasService.eliminarTesis(id);

            if (tesisActualId === id) {
                handleNuevaTesis();
            }

            await cargarListaTesis();
            toast.success('Tesis eliminada');
        } catch (error) {
            console.error('Error al eliminar tesis:', error);
            toast.error('Error al eliminar la tesis');
        }
    };

    // Función para volver al chat
    const handleBack = () => {
        navigate('/canvas/chat');
    };

    // Función para regenerar la tesis
    const handleRegenerar = async () => {
        if (!portada) return;

        // La confirmación ya se maneja en el componente CanvasHeader con AlertDialog

        try {
            setGenerando(true);

            // Resetear contenido
            const contenidoVacio = {
                portada: '',
                indice: '',
                resumen: '',
                introduccion: '',
                diagnostico: '',
                herramientas: '',
                desarrollo: '',
                pruebas: '',
                marco_teorico: '',
                metodologia: '',
                resultados: '',
                conclusiones: '',
                recomendaciones: '',
                referencias: ''
            };

            setContenidoSecciones(contenidoVacio);

            // Resetear estados de secciones
            setEstadoSecciones(prev => prev.map(e => ({ ...e, completada: false, generando: false, paginas: 0 })));
            setSeccionActual('portada');

            // Contexto para generación (recuperado de portada)
            const contexto = {
                titulo: portada.titulo,
                descripcion: portada.descripcion || '',
                carrera: portada.carrera,
                tipo: (portada.tipo || tipoTesis || 'desarrollo_software') as any,
                autor: portada.autor,
                tutor: portada.tutor,
                universidad: portada.universidad,
                facultad: portada.facultad,
                ciudad: portada.ciudad,
                fecha: portada.fecha,
                nivel: portada.nivel || 'grado_2',
                provider: proveedorLLM // Usar el proveedor seleccionado
            };

            // Estructura básica según nivel
            const esGrado2 = contexto.nivel === 'grado_2';

            const estructura = {
                capitulos: esGrado2 ? [
                    { numero: 1, titulo: 'Introducción' },
                    { numero: 2, titulo: 'Diagnóstico Situacional' },
                    { numero: 3, titulo: 'Herramientas de Desarrollo' },
                    { numero: 4, titulo: 'Desarrollo del Sistema' },
                    { numero: 5, titulo: 'Fase de Pruebas' },
                    { numero: 6, titulo: 'Conclusiones y Recomendaciones' }
                ] : [
                    { numero: 1, titulo: 'Introducción' },
                    { numero: 2, titulo: 'Marco Teórico' },
                    { numero: 3, titulo: 'Metodología' },
                    { numero: 4, titulo: 'Resultados' },
                    { numero: 5, titulo: 'Conclusiones y Recomendaciones' }
                ]
            };

            toast.info('Iniciando regeneración de tesis...');

            // Iniciar generación streaming reutilizando la lógica existente
            let buffer = '';
            let seccionActualGenerando: string | null = null;

            await new Promise<void>((resolve, reject) => {
                canvasService.generarTesisCompletaStream(
                    contexto,
                    estructura,
                    (chunk) => {
                        buffer += chunk;

                        // Buscar marcadores de sección
                        const markerRegex = /---SECCION:([a-z_]+)---/g;
                        let match;

                        // Procesar todos los marcadores encontrados
                        while ((match = markerRegex.exec(buffer)) !== null) {
                            const [fullMatch, nombreSeccion] = match;
                            const index = match.index;

                            // Texto antes del marcador pertenece a la sección anterior
                            if (index > 0 && seccionActualGenerando) {
                                const contenidoPrevio = buffer.substring(0, index);
                                const seccionKey = seccionActualGenerando as SeccionAcademica;

                                setContenidoSecciones(prev => ({
                                    ...prev,
                                    [seccionKey]: contenidoPrevio
                                }));

                                marcarSeccionCompletada(seccionKey);
                            }

                            // Actualizar sección actual
                            seccionActualGenerando = nombreSeccion;
                            setEstadoSecciones(prev => prev.map(s =>
                                s.seccion === nombreSeccion
                                    ? { ...s, generando: true }
                                    : s
                            ));

                            // Limpiar buffer procesado
                            buffer = buffer.substring(index + fullMatch.length);
                            markerRegex.lastIndex = 0; // Reiniciar regex para el nuevo buffer
                        }

                        // El contenido restante pertenece a la sección actual
                        if (seccionActualGenerando) {
                            const seccionKey = seccionActualGenerando as SeccionAcademica;
                            setContenidoSecciones(prev => ({
                                ...prev,
                                [seccionKey]: buffer
                            }));
                        }
                    },
                    () => {
                        // Completado
                        if (seccionActualGenerando) {
                            marcarSeccionCompletada(seccionActualGenerando as SeccionAcademica);
                        }
                        setGenerando(false);
                        toast.success('Tesis regenerada exitosamente');
                        resolve();
                    },
                    (error) => {
                        console.error('Error en stream:', error);
                        setGenerando(false);
                        toast.error('Error durante la generación');
                        reject(error);
                    }
                );
            });

        } catch (error: any) {
            console.error('Error al regenerar tesis:', error);
            toast.error('Error al regenerar la tesis');
            setGenerando(false);
        }
    };

    const handleExportarWord = async () => {
        if (!portada) {
            toast.error('No hay datos para exportar');
            return;
        }

        try {
            setExportando(true);
            toast.loading('Generando archivo Word...');

            // Estrategia: Usar contenidoSecciones si tiene contenido, sino extraer del DOM
            let seccionesParaExportar: Record<string, string> = {};

            const tieneContenido = Object.values(contenidoSecciones).some(v => v && v.length > 0);

            if (tieneContenido) {
                seccionesParaExportar = { ...contenidoSecciones };
            } else {
                const seccionesKeys: SeccionAcademica[] = [
                    'resumen', 'introduccion', 'diagnostico', 'herramientas',
                    'desarrollo', 'pruebas', 'marco_teorico', 'metodologia',
                    'resultados', 'conclusiones', 'recomendaciones', 'referencias'
                ];

                seccionesKeys.forEach(key => {
                    const seccionElement = document.querySelector(`#seccion-${key}`);
                    if (seccionElement) {
                        seccionesParaExportar[key] = seccionElement.innerHTML;
                    }
                });
            }

            const documento = {
                portada: portada,
                indiceHTML: contenidoSecciones.indice || '',
                seccionesHTML: Object.entries(seccionesParaExportar)
                    .filter(([key]) => key !== 'portada' && key !== 'indice')
                    .map(([key, html]) => ({
                        titulo: key,
                        contenidoHTML: html || ''
                    })),
                nivel: portada.nivel || 'grado_2'
            };

            const blob = await canvasService.exportarWord(documento);

            // Descargar archivo
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${portada.titulo.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.dismiss();
            toast.success('Archivo Word descargado');
        } catch (error) {
            console.error('Error al exportar Word:', error);
            toast.dismiss();
            toast.error('Error al exportar a Word');
        } finally {
            setExportando(false);
        }
    };

    const handleExportarPdf = async () => {
        if (!portada) {
            toast.error('No hay datos para exportar');
            return;
        }
        try {
            setExportandoPdf(true);
            toast.loading('Generando archivo PDF...');

            // Estrategia: Usar contenidoSecciones si tiene contenido, sino extraer del DOM
            let seccionesParaExportar: Record<string, string> = {};

            // Verificar si contenidoSecciones tiene contenido
            const tieneContenido = Object.values(contenidoSecciones).some(v => v && v.length > 0);

            if (tieneContenido) {
                // Usar contenidoSecciones directamente
                console.log('🔍 [FRONTEND DEBUG] Usando contenidoSecciones');
                seccionesParaExportar = { ...contenidoSecciones };
            } else {
                // Fallback: Extraer del DOM del canvas
                console.log('🔍 [FRONTEND DEBUG] Extrayendo del DOM del canvas');
                const seccionesKeys: SeccionAcademica[] = [
                    'resumen', 'introduccion', 'diagnostico', 'herramientas',
                    'desarrollo', 'pruebas', 'marco_teorico', 'metodologia',
                    'resultados', 'conclusiones', 'recomendaciones', 'referencias'
                ];

                seccionesKeys.forEach(key => {
                    const seccionElement = document.querySelector(`#seccion-${key}`);
                    if (seccionElement) {
                        seccionesParaExportar[key] = seccionElement.innerHTML;
                    }
                });
            }

            console.log('🔍 [FRONTEND DEBUG] Secciones para exportar:', {
                keys: Object.keys(seccionesParaExportar),
                resumenLength: seccionesParaExportar.resumen?.length || 0
            });

            // Usar el mismo formato HTML que Word
            const documento = {
                portada: portada,
                indiceHTML: contenidoSecciones.indice || '',
                seccionesHTML: Object.entries(seccionesParaExportar)
                    .filter(([key]) => key !== 'portada' && key !== 'indice')
                    .map(([key, html]) => ({
                        titulo: key,
                        contenidoHTML: html || ''
                    })),
                nivel: portada.nivel || 'grado_2'
            };

            const blob = await canvasService.exportarPdf(documento);

            // Descargar archivo
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${portada.titulo.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.dismiss();
            toast.success('Archivo PDF descargado');
        } catch (error) {
            console.error('Error al exportar PDF:', error);
            toast.dismiss();
            toast.error('Error al exportar a PDF');
        } finally {
            setExportandoPdf(false);
        }
    };

    const handleContenidoChange = (contenido: string) => {
        setContenidoSecciones(prev => ({
            ...prev,
            [seccionActual]: contenido
        }));
    };

    // Función para obtener el título de la sección
    const getTituloSeccion = (seccion: SeccionAcademica): string => {
        const nivel = portada?.nivel || 'grado_2';

        if (nivel === 'grado_1') {
            const titulosGrado1: Record<SeccionAcademica, string> = {
                portada: 'PORTADA',
                indice: 'ÍNDICE GENERAL',
                resumen: 'RESUMEN',
                introduccion: 'CAPÍTULO I: INTRODUCCIÓN',
                marco_teorico: 'CAPÍTULO II: MARCO TEÓRICO',
                metodologia: 'CAPÍTULO III: MARCO METODOLÓGICO',
                resultados: 'CAPÍTULO IV: RESULTADOS',
                conclusiones: 'CAPÍTULO V: CONCLUSIONES Y RECOMENDACIONES',
                recomendaciones: '', // Integrado
                referencias: 'REFERENCIAS BIBLIOGRÁFICAS',
                // Fallbacks para secciones de Grado II si aparecieran por error
                diagnostico: 'DIAGNÓSTICO',
                herramientas: 'HERRAMIENTAS',
                desarrollo: 'DESARROLLO',
                pruebas: 'PRUEBAS'
            };
            return titulosGrado1[seccion] || seccion.toUpperCase();
        } else {
            // Grado II - Estructura exacta a la imagen
            const titulosGrado2: Record<SeccionAcademica, string> = {
                portada: 'PORTADA',
                indice: 'ÍNDICE GENERAL',
                resumen: '3. RESUMEN',
                diagnostico: '4. Diagnóstico Situacional',
                herramientas: '5. Determinación, Instalación y Configuración de Herramientas',
                desarrollo: '6. Desarrollo del Sistema de Información',
                pruebas: '7. Fase de Pruebas',
                conclusiones: '8. Conclusiones',
                recomendaciones: '9. Recomendaciones',
                referencias: '10. Referencias',
                // Fallbacks
                introduccion: 'INTRODUCCIÓN',
                marco_teorico: 'MARCO TEÓRICO',
                metodologia: 'METODOLOGÍA',
                resultados: 'RESULTADOS'
            };
            return titulosGrado2[seccion] || seccion.toUpperCase();
        }
    };

    // Protección contra cierre/recarga de pestaña
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (generando) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [generando]);

    // Estado para alerta de navegación interna
    const [showNavigationAlert, setShowNavigationAlert] = useState(false);
    const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

    const handleNavigationAttempt = (action: () => void) => {
        if (generando) {
            setPendingNavigationAction(() => action);
            setShowNavigationAlert(true);
        } else {
            action();
        }
    };

    // Estado para mensaje de interrupción
    const [mensajeInterrupcion, setMensajeInterrupcion] = useState<string | null>(null);

    const confirmNavigation = () => {
        if (pendingNavigationAction) {
            // Si estamos generando, marcar como interrumpida para la próxima vez
            if (generando && tesisActualId) {
                localStorage.setItem(`interrupted_${tesisActualId}`, 'true');
            }

            pendingNavigationAction();
            setPendingNavigationAction(null);
        }
        setShowNavigationAlert(false);
    };

    const cancelNavigation = () => {
        setPendingNavigationAction(null);
        setShowNavigationAlert(false);
    };

    const handleNuevaTesis = () => {
        handleNavigationAttempt(() => {
            // Validar cooldown de 3 minutos
            const lastCreation = localStorage.getItem('last_thesis_creation_timestamp');
            if (lastCreation) {
                const timeDiff = Date.now() - parseInt(lastCreation);
                const cooldownTime = 3 * 60 * 1000; // 3 minutos en milisegundos

                if (timeDiff < cooldownTime) {
                    const remainingSeconds = Math.ceil((cooldownTime - timeDiff) / 1000);
                    const minutes = Math.floor(remainingSeconds / 60);
                    const seconds = remainingSeconds % 60;

                    toast.error(`Debes esperar ${minutes}:${seconds.toString().padStart(2, '0')} para crear una nueva tesis.`);
                    return;
                }
            }

            // Guardar timestamp de creación
            localStorage.setItem('last_thesis_creation_timestamp', Date.now().toString());

            setTesisActualId(null);
            setPortada(null);
            setWizardCompletado(false);
            setSeccionActual('portada');

            // Resetear contenido
            setContenidoSecciones({
                portada: '',
                indice: '',
                resumen: '',
                introduccion: '',
                diagnostico: '',
                herramientas: '',
                desarrollo: '',
                pruebas: '',
                marco_teorico: '',
                metodologia: '',
                resultados: '',
                conclusiones: '',
                recomendaciones: '',
                referencias: ''
            });

            // Resetear estados de secciones
            setEstadoSecciones(prev => prev.map(e => ({ ...e, completada: false, generando: false, paginas: 0 })));

            toast.success('Listo para comenzar una nueva tesis');
        });
    };

    return (
        <div className="flex h-screen w-full bg-[#f9f9f9] dark:bg-[#1e1e1e] overflow-hidden">
            {/* Sidebar con protección de navegación */}
            <div className="relative z-10 flex-shrink-0">
                <SidebarCanvas
                    tesisActualId={tesisActualId || undefined}
                    onSeleccionarTesis={(id) => handleNavigationAttempt(() => handleSeleccionarTesis(id))}
                    onNuevaTesis={handleNuevaTesis}
                    onEliminarTesis={handleEliminarTesis}
                    onExportarWord={handleExportarWord}
                    onExportarPdf={handleExportarPdf}
                    onBack={handleBack}
                    exportando={exportando}
                    exportandoPdf={exportandoPdf}
                    capitulosGenerados={estadoSecciones.filter(e => e.completada).length}
                    totalCapitulos={estadoSecciones.length}
                    tesisList={tesisList}
                    loading={loadingTesis}
                    isOpen={sidebarOpen}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-[#1e1e1e] relative">
                <CanvasHeader
                    tituloTesis={portada?.titulo}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onRegenerar={portada ? handleRegenerar : undefined}
                    editor={editor}
                    proveedorSeleccionado={proveedorLLM}
                    onProveedorChange={setProveedorLLM}
                />

                <div className="flex-1 flex overflow-hidden">
                    {/* Wizard / Secciones Académicas */}
                    <div
                        className="w-96 border-r border-[var(--border)] bg-[var(--background)] flex-shrink-0"
                    >
                        {!wizardCompletado ? (
                            <ChatCanvas
                                onGenerarIndice={handleGenerarTesisCompleta}
                                onGenerarCapitulo={() => { }}
                                generando={generando}
                                indiceGenerado={false}
                                capitulosDisponibles={0}
                                mensajeInterrupcion={mensajeInterrupcion}
                                proveedorLLM={proveedorLLM}
                                onIniciarGeneracion={handleIniciarGeneracion}
                            />
                        ) : (
                            <SeccionesAcademicas
                                seccionActual={seccionActual}
                                estadoSecciones={getSeccionesFiltradas()}
                                onSeleccionarSeccion={setSeccionActual}
                            />
                        )}
                    </div>

                    {/* Canvas / Editor */}
                    <div className={`flex-1 bg-[var(--background)] overflow-hidden transition-all duration-700 ease-in-out ${wizardCompletado ? 'animate-in slide-in-from-right-10 fade-in' : ''}`}>
                        {!wizardCompletado ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-[var(--muted-foreground)]">
                                    <p className="text-lg">Completa el wizard para comenzar</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto relative">
                                {/* Indicador de generación sutil */}
                                {generando && (
                                    <div className="absolute top-4 right-4 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-800 flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin text-[var(--primary)]" />
                                        {(() => {
                                            const seccionEstado = estadoSecciones.find(e => e.seccion === seccionActual);
                                            if (seccionActual === 'indice' && !seccionEstado?.generando) { // Índice se marca como completado inmediatamente
                                                return <span className="text-green-600 dark:text-green-400">✅ {getTituloSeccion(seccionActual)} generado con éxito</span>;
                                            } else if (seccionEstado?.completada) {
                                                return <span className="text-green-600 dark:text-green-400">✅ {getTituloSeccion(seccionActual)} generado con éxito</span>;
                                            } else if (seccionEstado?.generando) {
                                                return <span className="text-xs font-medium text-[var(--foreground)]">Generando {getTituloSeccion(seccionActual)}...</span>;
                                            } else {
                                                return <span className="text-xs font-medium text-[var(--foreground)]">Preparando generación...</span>;
                                            }
                                        })()}
                                    </div>
                                )}

                                {seccionActual === 'portada' && portada ? (
                                    <PortadaEditable
                                        portada={portada}
                                        logoUrl="/universityImages/unerg-logo-png_seeklogo-265623.png"
                                        onChange={(nuevaPortada) => {
                                            setPortada(nuevaPortada);
                                            // Guardar automáticamente cuando se edita la portada
                                            if (tesisActualId) {
                                                guardarProgreso(nuevaPortada, contenidoSecciones, tesisActualId, tipoTesis);
                                            }
                                        }}
                                    />
                                ) : (
                                    <SeccionView
                                        titulo={getTituloSeccion(seccionActual)}
                                        editable={true}
                                    >
                                        <TesisEditorWYSIWYG
                                            content={contenidoSecciones[seccionActual]}
                                            onChange={handleContenidoChange}
                                            editable={true}
                                            onEditorReady={setEditor}
                                        />
                                    </SeccionView>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Diálogo de advertencia de navegación */}
            <AlertDialog open={showNavigationAlert} onOpenChange={setShowNavigationAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Generación en curso
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Se está generando contenido para tu tesis. Si sales ahora, el proceso se interrumpirá y podrías perder el progreso actual.
                            <br /><br />
                            ¿Estás seguro de que deseas salir?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <div className="flex gap-2 justify-end w-full">
                            <button
                                onClick={cancelNavigation}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmNavigation}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Salir y detener
                            </button>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog para error de sobrecarga */}
            <AlertDialog open={errorSobrecarga} onOpenChange={setErrorSobrecarga}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <AlertDialogTitle className="text-xl">
                                Modelo Sobrecargado
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-base space-y-3 pt-2">
                            <p className="font-medium text-foreground">
                                El modelo de IA de Google Gemini está temporalmente sobrecargado.
                            </p>
                            <p>
                                La generación de tu tesis se ha detenido para evitar contenido incompleto o de baja calidad.
                            </p>
                            <div className="bg-muted p-3 rounded-md border border-border">
                                <p className="text-sm font-medium mb-1">¿Qué hacer?</p>
                                <ul className="text-sm space-y-1 list-disc list-inside">
                                    <li>Espera 2-3 minutos</li>
                                    <li>Regenera la tesis completa</li>
                                    <li>El sistema intentará nuevamente</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setErrorSobrecarga(false)}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Entendido
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Animación de inicio inmersiva */}
            <AnimacionInicioCanvas
                mostrar={mostrarAnimacionInicio}
                onComplete={() => setMostrarAnimacionInicio(false)}
            />
        </div>
    );
}
