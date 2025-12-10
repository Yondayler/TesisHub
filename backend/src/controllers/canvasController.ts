import { Request, Response, NextFunction } from 'express';
import { CanvasService } from '../services/canvasService';
import { AuthRequest } from '../types';
import { AppError } from '../utils/errors';
import { checkModelHealth, isSafeToGenerate } from '../utils/modelHealthCheck';
import { apiLogger } from '../utils/apiLogger';

/**
 * Controlador para endpoints de Canvas (generación de tesis)
 */
export class CanvasController {

    /**
     * GET /api/canvas/health-check
     * Verifica la salud del modelo antes de generar tesis
     */
    static async healthCheck(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const modelo = (req.query.modelo as 'rapido' | 'razonamiento' | 'canvas') || 'canvas';

            console.log(`🏥 [CANVAS CONTROLLER] Verificando salud del modelo: ${modelo}`);

            const health = await checkModelHealth(modelo);

            // También obtener estadísticas de uso
            const stats = apiLogger.getStats(3600000); // Última hora

            res.json({
                success: true,
                data: {
                    health,
                    stats: {
                        lastHour: stats,
                        recommendation: health.healthy
                            ? 'El modelo está operativo. Es seguro generar tesis.'
                            : `No es recomendable generar tesis en este momento. ${health.message}`
                    }
                }
            });

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en healthCheck:', error);
            next(error);
        }
    }

    /**
     * POST /api/canvas/generar-indice
     * Genera el índice completo de una tesis
     */
    static async generarIndice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { titulo, descripcion, carrera, tipo, modelo } = req.body;

            console.log(`📋 [CANVAS CONTROLLER] Usuario ${usuario.id} generando índice para: ${titulo}`);
            console.log('📦 [CANVAS CONTROLLER] Datos recibidos:', JSON.stringify(req.body, null, 2));

            // Validaciones
            if (!titulo || !descripcion || !carrera || !tipo) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: titulo, descripcion, carrera, tipo'
                });
            }

            const tiposValidos = ['desarrollo_software', 'investigacion_campo', 'estudio_caso', 'revision_literatura'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}`
                });
            }

            // Generar índice
            const indice = await CanvasService.generarIndice(
                { titulo, descripcion, carrera, tipo },
                modelo || 'canvas'
            );

            res.json({
                success: true,
                data: indice
            });

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en generarIndice:', error);
            next(error);
        }
    }

    /**
     * POST /api/canvas/generar-capitulo
     * Genera un capítulo específico de la tesis
     */
    static async generarCapitulo(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { numeroCapitulo, tituloCapitulo, subsecciones, contextoTesis, capitulosAnteriores, modelo } = req.body;

            console.log(`📝 [CANVAS CONTROLLER] Usuario ${usuario.id} generando capítulo ${numeroCapitulo}`);

            // Validaciones
            if (!numeroCapitulo || !tituloCapitulo || !subsecciones || !contextoTesis) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: numeroCapitulo, tituloCapitulo, subsecciones, contextoTesis'
                });
            }

            if (!Array.isArray(subsecciones) || subsecciones.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'subsecciones debe ser un array no vacío'
                });
            }

            // Generar capítulo
            const capitulo = await CanvasService.generarCapitulo(
                {
                    numeroCapitulo,
                    tituloCapitulo,
                    subsecciones,
                    contextoTesis,
                    capitulosAnteriores
                },
                modelo || 'canvas'
            );

            res.json({
                success: true,
                data: capitulo
            });

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en generarCapitulo:', error);
            next(error);
        }
    }

    /**
     * POST /api/canvas/exportar-word
     * Exporta el documento completo a formato Word
     */
    static async exportarWord(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { documento } = req.body;

            console.log(`📄 [CANVAS CONTROLLER] Usuario ${usuario.id} exportando documento a Word`);

            // Validaciones - soportar ambos formatos
            if (!documento || !documento.portada) {
                return res.status(400).json({
                    success: false,
                    error: 'Documento inválido. Debe incluir portada'
                });
            }

            // Validar formato legacy (capitulos) o nuevo formato (seccionesHTML)
            const esFormatoHTML = 'seccionesHTML' in documento;
            const esFormatoLegacy = 'capitulos' in documento;

            if (!esFormatoHTML && !esFormatoLegacy) {
                return res.status(400).json({
                    success: false,
                    error: 'Documento inválido. Debe incluir capitulos o seccionesHTML'
                });
            }

            if (esFormatoLegacy && (!Array.isArray(documento.capitulos) || documento.capitulos.length === 0)) {
                return res.status(400).json({
                    success: false,
                    error: 'El documento debe tener al menos un capítulo'
                });
            }

            if (esFormatoHTML && (!Array.isArray(documento.seccionesHTML) || documento.seccionesHTML.length === 0)) {
                return res.status(400).json({
                    success: false,
                    error: 'El documento debe tener al menos una sección'
                });
            }

            // Generar archivo Word
            const buffer = await CanvasService.exportarWord(documento);

            // Configurar headers para descarga
            const filename = `${documento.portada.titulo.replace(/[^a-z0-9]/gi, '_')}.docx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);

            res.send(buffer);

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en exportarWord:', error);
            next(error);
        }
    }

    /**
     * POST /api/canvas/exportar-pdf
     * Exporta el documento completo a formato PDF
     */
    static async exportarPdf(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { documento } = req.body;

            console.log(`📄 [CANVAS CONTROLLER] Usuario ${usuario.id} exportando documento a PDF`);
            console.log(`🔍 [DEBUG] Documento recibido:`, {
                tienePortada: !!documento?.portada,
                tieneCapitulos: 'capitulos' in (documento || {}),
                tieneSeccionesHTML: 'seccionesHTML' in (documento || {}),
                seccionesHTMLLength: documento?.seccionesHTML?.length,
                seccionesHTMLKeys: documento?.seccionesHTML?.map((s: any) => s.seccion)
            });

            // Validaciones - soportar ambos formatos
            if (!documento || !documento.portada) {
                console.log('❌ [DEBUG] Falla validación: sin portada');
                return res.status(400).json({
                    success: false,
                    error: 'Documento inválido. Debe incluir portada'
                });
            }

            // Validar formato legacy (capitulos) o nuevo formato (seccionesHTML)
            const esFormatoHTML = 'seccionesHTML' in documento;
            const esFormatoLegacy = 'capitulos' in documento;

            console.log(`🔍 [DEBUG] Formato detectado: HTML=${esFormatoHTML}, Legacy=${esFormatoLegacy}`);

            if (!esFormatoHTML && !esFormatoLegacy) {
                console.log('❌ [DEBUG] Falla validación: sin capitulos ni seccionesHTML');
                return res.status(400).json({
                    success: false,
                    error: 'Documento inválido. Debe incluir capitulos o seccionesHTML'
                });
            }

            if (esFormatoLegacy && (!Array.isArray(documento.capitulos) || documento.capitulos.length === 0)) {
                console.log('❌ [DEBUG] Falla validación: capitulos vacío o no es array');
                return res.status(400).json({
                    success: false,
                    error: 'El documento debe tener al menos un capítulo'
                });
            }

            if (esFormatoHTML && (!Array.isArray(documento.seccionesHTML) || documento.seccionesHTML.length === 0)) {
                console.log('❌ [DEBUG] Falla validación: seccionesHTML vacío o no es array');
                console.log('📋 [DEBUG] seccionesHTML:', documento.seccionesHTML);
                return res.status(400).json({
                    success: false,
                    error: 'El documento debe tener al menos una sección'
                });
            }

            // DEBUG: Ver contenido de cada sección
            if (esFormatoHTML) {
                console.log('🔍 [DEBUG CONTROLLER] Secciones recibidas del frontend:');
                documento.seccionesHTML.forEach((sec: any, idx: number) => {
                    console.log(`  Sección ${idx}:`, {
                        titulo: sec.titulo,
                        tieneContenidoHTML: !!sec.contenidoHTML,
                        longitudContenido: sec.contenidoHTML?.length || 0,
                        primeros200: sec.contenidoHTML?.substring(0, 200) || 'VACÍO'
                    });
                });
            }

            // Generar archivo PDF
            const buffer = await CanvasService.exportarPdf(documento);

            // Configurar headers para descarga
            const filename = `${documento.portada.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);

            res.send(buffer);

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en exportarPdf:', error);
            next(error);
        }
    }

    /**
     * POST /api/canvas/exportar-capitulo
     * Exporta un capítulo individual a Word (para preview)
     */
    static async exportarCapitulo(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { capitulo } = req.body;

            console.log(`📄 [CANVAS CONTROLLER] Usuario ${usuario.id} exportando capítulo ${capitulo?.numero}`);

            // Validaciones
            if (!capitulo || !capitulo.numero || !capitulo.titulo || !capitulo.subsecciones) {
                return res.status(400).json({
                    success: false,
                    error: 'Capítulo inválido. Debe incluir numero, titulo y subsecciones'
                });
            }

            // Generar archivo Word
            const buffer = await CanvasService.exportarCapitulo(capitulo);

            // Configurar headers para descarga
            const filename = `Capitulo_${capitulo.numero}.docx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);

            res.send(buffer);

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en exportarCapitulo:', error);
            next(error);
        }
    }

    /**
     * POST /api/canvas/generar-titulo
     * Genera un título académico basado en un tema
     */
    static async generarTitulo(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { tema, carrera, provider } = req.body;

            console.log(`💡 [CANVAS CONTROLLER] Usuario ${usuario.id} generando título para: ${tema} con provider: ${provider || 'gemini'}`);

            // Validaciones
            if (!tema || !carrera) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan campos requeridos: tema, carrera'
                });
            }

            // Generar título con el proveedor especificado
            const titulo = await CanvasService.generarTitulo(tema, carrera, provider || 'gemini');

            res.json({
                success: true,
                data: { titulo }
            });

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en generarTitulo:', error);
            next(error);
        }
    }

    /**
     * Genera toda la tesis completa con streaming (SSE)
     */
    static async generarTesisCompleta(req: Request, res: Response) {
        try {
            console.log('📡 [CANVAS] Iniciando generación de tesis completa con streaming');

            // Configurar headers para SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            // Recibir datos por query params
            const contexto = {
                titulo: req.query.titulo as string,
                descripcion: req.query.descripcion as string,
                carrera: req.query.carrera as string,
                tipo: req.query.tipo as string || 'investigación documental',
                provider: (req.query.provider as string) || 'gemini'
            };

            const estructura = {
                capitulos: [
                    "Introducción",
                    "Marco Teórico",
                    "Metodología",
                    "Resultados",
                    "Conclusiones"
                ]
            };

            // Callback para enviar chunks
            const onChunk = (chunk: string) => {
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            };

            // Callback al completar
            const onComplete = () => {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                res.end();
            };

            console.log(`📡 [CANVAS] Generando con provider: ${contexto.provider}`);

            // Iniciar generación
            await CanvasService.generarTesisCompletaConStreaming(
                contexto,
                estructura,
                onChunk,
                onComplete
            );

        } catch (error: any) {
            console.error('❌ Error en streaming de tesis completa:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }

    /**
     * GET /api/canvas/generar-seccion-stream/:seccion
     * Genera una sección de la tesis con streaming (SSE)
     */
    static async generarSeccionStream(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuario = req.usuario!;
            const { seccion } = req.params;
            const { contexto, estructura } = req.query;

            console.log(`📡 [CANVAS CONTROLLER] Usuario ${usuario.id} generando sección con streaming: ${seccion}`);

            // Configurar headers para SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Desactivar buffering en nginx

            // Parsear contexto y estructura
            const contextoObj = contexto ? JSON.parse(contexto as string) : {};
            const estructuraObj = estructura ? JSON.parse(estructura as string) : {};

            // Callback para enviar chunks
            const sendChunk = (chunk: string) => {
                res.write(`data: ${JSON.stringify({ chunk })}

`);
            };

            // Callback para enviar fin
            const sendComplete = () => {
                res.write(`data: ${JSON.stringify({ done: true })}

`);
                res.end();
            };

            // Callback para enviar error
            const sendError = (error: string) => {
                res.write(`data: ${JSON.stringify({ error })}

`);
                res.end();
            };

            // Generar contenido según la sección
            try {
                await CanvasService.generarSeccionConStreaming(
                    seccion,
                    contextoObj,
                    estructuraObj,
                    sendChunk,
                    sendComplete
                );
            } catch (error: any) {
                console.error(`❌ [CANVAS CONTROLLER] Error generando sección ${seccion}:`, error);
                sendError(error.message || 'Error al generar sección');
            }

        } catch (error: any) {
            console.error('❌ [CANVAS CONTROLLER] Error en generarSeccionStream:', error);
            // Si ya se enviaron headers, no podemos usar next()
            if (!res.headersSent) {
                next(error);
            } else {
                res.end();
            }
        }
    }
}
