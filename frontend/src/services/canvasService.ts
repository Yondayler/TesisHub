import { api, API_URL } from './api';
import { ApiResponse } from '../types';
import type {
    DatosGeneracionIndice,
    DatosGeneracionCapitulo,
    IndiceGenerado,
    Capitulo,
    DocumentoTesis,
    DocumentoTesisHTML
} from '../types/canvas';

/**
 * Servicio para interactuar con la API de Canvas (generación de tesis)
 */
export const canvasService = {
    /**
     * Genera el índice completo de una tesis
     */
    async generarIndice(datos: DatosGeneracionIndice): Promise<IndiceGenerado> {
        console.log('🚀 [FRONTEND SERVICE] Enviando solicitud generarIndice:', datos);
        const response = await api.post<ApiResponse<IndiceGenerado>>('/canvas/generar-indice', datos);

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Error al generar índice');
        }

        return response.data.data;
    },

    /**
     * Genera un capítulo específico de la tesis
     */
    async generarCapitulo(datos: DatosGeneracionCapitulo): Promise<Capitulo> {
        const response = await api.post<ApiResponse<Capitulo>>('/canvas/generar-capitulo', datos);

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Error al generar capítulo');
        }

        return response.data.data;
    },

    /**
     * Exporta el documento completo a Word
     */
    async exportarWord(documento: DocumentoTesisHTML | DocumentoTesis): Promise<Blob> {
        const response = await api.post('/canvas/exportar-word', { documento }, {
            responseType: 'blob'
        });

        return response.data;
    },

    /**
     * Exporta el documento completo a PDF
     */
    async exportarPdf(documento: DocumentoTesisHTML | DocumentoTesis): Promise<Blob> {
        const response = await api.post('/canvas/exportar-pdf', { documento }, {
            responseType: 'blob'
        });

        return response.data;
    },

    /**
     * Exporta un capítulo individual a Word
     */
    async exportarCapitulo(capitulo: Capitulo): Promise<Blob> {
        const response = await api.post('/canvas/exportar-capitulo', { capitulo }, {
            responseType: 'blob'
        });

        return response.data;
    },

    /**
     * Genera un título sugerido basado en un tema
     */
    async generarTitulo(tema: string, carrera: string, provider: 'gemini' | 'groq' = 'gemini'): Promise<string> {
        const response = await api.post<ApiResponse<{ titulo: string }>>('/canvas/generar-titulo', { tema, carrera, provider });

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Error al generar título');
        }

        return response.data.data.titulo;
    },

    /**
     * Descarga un archivo blob con el nombre especificado
     */
    descargarArchivo(blob: Blob, nombreArchivo: string) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Lista todas las tesis del usuario
     */
    async listarTesis(): Promise<any[]> {
        const response = await api.get<ApiResponse<any[]>>('/tesis-canvas');

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Error al listar tesis');
        }

        return response.data.data;
    },

    /**
     * Obtiene una tesis específica
     */
    async obtenerTesis(id: number): Promise<any> {
        const response = await api.get<ApiResponse<any>>(`/tesis-canvas/${id}`);

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Error al obtener tesis');
        }

        return response.data.data;
    },

    /**
     * Guarda una nueva tesis
     */
    async guardarTesis(datos: any): Promise<number> {
        const response = await api.post<ApiResponse<{ id: number }>>('/tesis-canvas', datos);

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.error || 'Error al guardar tesis');
        }

        return response.data.data.id;
    },

    /**
     * Actualiza una tesis existente
     */
    async actualizarTesis(id: number, datos: any): Promise<void> {
        const response = await api.put<ApiResponse<any>>(`/tesis-canvas/${id}`, datos);

        if (!response.data.success) {
            throw new Error(response.data.error || 'Error al actualizar tesis');
        }
    },

    /**
     * Elimina una tesis
     */
    async eliminarTesis(id: number): Promise<void> {
        const response = await api.delete<ApiResponse<any>>(`/tesis-canvas/${id}`);

        if (!response.data.success) {
            throw new Error(response.data.error || 'Error al eliminar tesis');
        }
    },

    /**
     * Genera toda la tesis completa con streaming (SSE)
     */
    generarTesisCompletaStream(
        contexto: any,
        estructura: any,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: string) => void
    ): EventSource {
        const token = localStorage.getItem('token');
        if (!token) {
            onError('No hay sesión activa');
            throw new Error('No hay sesión activa');
        }

        // Construir URL con parámetros
        const params = new URLSearchParams({
            token, // Enviar token por query param para SSE
            titulo: contexto.titulo,
            descripcion: contexto.descripcion,
            carrera: contexto.carrera,
            tipo: contexto.tipo || 'investigación documental',
            provider: contexto.provider || 'gemini', // Default a Gemini
            estructura: JSON.stringify(estructura)
        });

        // Assuming API_BASE_URL is defined elsewhere or needs to be added.
        // For now, I'll use a placeholder or assume it's implicitly handled by the proxy.
        // If `api` is an axios instance, it might have a baseURL configured.
        // For EventSource, we need the full URL. Let's assume `/api` prefix is handled by proxy.
        const url = `${API_URL}/canvas/generar-tesis-completa-stream?${params.toString()}`;

        console.log('📡 Conectando a SSE para tesis completa:', url);
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.chunk) {
                    onChunk(data.chunk);
                } else if (data.done) {
                    eventSource.close();
                    onComplete();
                } else if (data.error) {
                    eventSource.close();
                    onError(data.error);
                }
            } catch (error) {
                console.error('Error al procesar mensaje SSE:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('Error en conexión SSE:', error);
            eventSource.close();
            onError('Error de conexión con el servidor de generación');
        };

        return eventSource;
    },

    /**
     * Genera una sección con streaming (SSE)
     */
    async generarSeccionStream(
        seccion: string,
        contexto: any,
        estructura: any,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        onError: (error: string) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            // Obtener token del localStorage
            const token = localStorage.getItem('token');

            const params = new URLSearchParams({
                contexto: JSON.stringify(contexto),
                estructura: JSON.stringify(estructura),
                ...(token && { token }) // Agregar token si existe
            });

            const url = `/api/canvas/generar-seccion-stream/${seccion}?${params}`;

            // EventSource no soporta headers personalizados, usamos query params para auth
            const eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.error) {
                        eventSource.close();
                        onError(data.error);
                        reject(new Error(data.error));
                    } else if (data.done) {
                        eventSource.close();
                        onComplete();
                        resolve();
                    } else if (data.chunk) {
                        onChunk(data.chunk);
                    }
                } catch (error) {
                    console.error('Error parsing SSE data:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('SSE Error:', error);
                eventSource.close();
                onError('Error de conexión');
                reject(error);
            };
        });
    }
};
