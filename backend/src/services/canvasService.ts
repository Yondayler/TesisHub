import { crearAgenteTesis } from '../mastra/agents';
import { generarDocumentoTesis, generarCapituloIndividual, type DocumentoTesis, type Capitulo, type DatosPortada } from '../utils/wordGenerator';
import { generarDocumentoPdf } from '../utils/pdfGenerator';
import { AppError } from '../utils/errors';
import { apiLogger, APICallLog } from '../utils/apiLogger';

/**
 * Interfaz para datos de generación de índice
 */
export interface DatosGeneracionIndice {
  titulo: string;
  descripcion: string;
  carrera: string;
  tipo: 'desarrollo_software' | 'investigacion_campo' | 'estudio_caso' | 'revision_literatura';
}

/**
 * Interfaz para datos de generación de capítulo
 */
export interface DatosGeneracionCapitulo {
  numeroCapitulo: number;
  tituloCapitulo: string;
  subsecciones: string[];
  contextoTesis: {
    titulo: string;
    descripcion: string;
    carrera: string;
    tipo: string;
  };
  capitulosAnteriores?: any[];
}

/**
 * Servicio para gestionar la generación de tesis con Canvas
 */
export class CanvasService {

  /**
   * Genera el índice completo de una tesis
   */
  static async generarIndice(datos: DatosGeneracionIndice, modelo: 'rapido' | 'razonamiento' | 'canvas' = 'canvas'): Promise<any> {
    try {
      console.log(`📋 [CANVAS] Generando índice con modelo: ${modelo}`);

      // Crear agente con modelo específico
      const agente = crearAgenteTesis(modelo);

      // Construir prompt para generación de índice
      const prompt = this.construirPromptIndice(datos);

      // Ejecutar agente
      const resultado = await agente.generate([
        { role: 'user', content: prompt }
      ] as any);

      // Parsear respuesta JSON
      const indice = this.parsearRespuestaJSON(resultado.text);

      console.log(`✅ [CANVAS] Índice generado con ${indice.capitulos?.length || 0} capítulos`);

      return indice;

    } catch (error: any) {
      console.error('❌ [CANVAS] Error al generar índice:', error);
      throw new AppError(`Error al generar índice: ${error.message}`, 500);
    }
  }

  /**
   * Genera un capítulo específico de la tesis
   */
  static async generarCapitulo(datos: DatosGeneracionCapitulo, modelo: 'rapido' | 'razonamiento' | 'canvas' = 'canvas'): Promise<Capitulo> {
    try {
      console.log(`📝 [CANVAS] Generando capítulo ${datos.numeroCapitulo} con modelo: ${modelo}`);

      // Crear agente con modelo específico
      const agente = crearAgenteTesis(modelo);

      // Construir prompt para generación de capítulo
      const prompt = this.construirPromptCapitulo(datos);

      // Ejecutar agente
      const resultado = await agente.generate([
        { role: 'user', content: prompt }
      ] as any);

      // Parsear respuesta JSON
      const capitulo = this.parsearRespuestaJSON(resultado.text);

      console.log(`✅ [CANVAS] Capítulo ${datos.numeroCapitulo} generado con ${capitulo.subsecciones?.length || 0} subsecciones`);

      return capitulo;

    } catch (error: any) {
      console.error(`❌ [CANVAS] Error al generar capítulo ${datos.numeroCapitulo}:`, error);
      throw new AppError(`Error al generar capítulo: ${error.message}`, 500);
    }
  }

  /**
   * Exporta el documento completo a formato Word
   * Soporta tanto el formato legacy (capitulos) como el nuevo formato HTML
   */
  static async exportarWord(documento: any): Promise<Buffer> {
    try {
      console.log(`📄 [CANVAS] Exportando documento a Word...`);

      // Detectar si es el nuevo formato con HTML
      const esFormatoHTML = 'indiceHTML' in documento && 'seccionesHTML' in documento;

      let buffer: Buffer;

      if (esFormatoHTML) {
        console.log(`✨ [CANVAS] Usando exportación con soporte HTML completo`);

        // Convertir al formato esperado por generarDocumentoTesisHTML
        const { portada, indiceHTML, seccionesHTML, nivel } = documento;

        // Mapear títulos de secciones según el nivel
        const titulosGrado1: Record<string, string> = {
          resumen: 'RESUMEN',
          introduccion: 'CAPÍTULO I: INTRODUCCIÓN',
          marco_teorico: 'CAPÍTULO II: MARCO TEÓRICO',
          metodologia: 'CAPÍTULO III: METODOLOGÍA',
          resultados: 'CAPÍTULO IV: RESULTADOS',
          conclusiones: 'CAPÍTULO V: CONCLUSIONES',
          recomendaciones: 'RECOMENDACIONES',
          referencias: 'REFERENCIAS BIBLIOGRÁFICAS'
        };

        const titulosGrado2: Record<string, string> = {
          resumen: '3. RESUMEN',
          diagnostico: '4. DIAGNÓSTICO SITUACIONAL',
          herramientas: '5. DETERMINACIÓN, INSTALACIÓN Y CONFIGURACIÓN DE LAS HERRAMIENTAS DE DESARROLLO',
          desarrollo: '6. DESARROLLO DE LA APLICACIÓN',
          pruebas: '7. FASE DE PRUEBAS',
          conclusiones: '8. CONCLUSIONES',
          recomendaciones: '9. RECOMENDACIONES',
          referencias: '10. REFERENCIAS'
        };

        const titulos = nivel === 'grado_1' ? titulosGrado1 : titulosGrado2;

        // Convertir seccionesHTML al formato esperado
        // Manejar tanto el formato { seccion, contenidoHTML } como { titulo, contenidoHTML }
        const seccionesFormateadas = seccionesHTML.map((s: any) => {
          // Determinar el nombre de la sección (puede venir como 'seccion' o 'titulo')
          const nombreSeccion = s.seccion || s.titulo;

          // Si nombreSeccion es undefined o null, usar un valor por defecto
          if (!nombreSeccion) {
            console.warn('⚠️ [CANVAS] Sección sin nombre encontrada, usando "Sin título"');
            return {
              titulo: 'Sin título',
              contenidoHTML: s.contenidoHTML || ''
            };
          }

          // Buscar el título formateado en el mapeo, o usar el nombre en mayúsculas
          const tituloFormateado = titulos[nombreSeccion] || nombreSeccion.toString().toUpperCase();

          return {
            titulo: tituloFormateado,
            contenidoHTML: s.contenidoHTML || ''
          };
        });

        const documentoHTML = {
          portada,
          indiceHTML,
          seccionesHTML: seccionesFormateadas
        };

        // Importar la nueva función
        const { generarDocumentoTesisHTML } = await import('../utils/wordGenerator');
        buffer = await generarDocumentoTesisHTML(documentoHTML);

      } else {
        // Formato legacy (capitulos)
        console.log(`📝 [CANVAS] Usando exportación legacy (texto plano)`);
        buffer = await generarDocumentoTesis(documento);
      }

      console.log(`✅ [CANVAS] Documento exportado exitosamente (${buffer.length} bytes)`);
      return buffer;

    } catch (error: any) {
      console.error('❌ [CANVAS] Error al exportar a Word:', error);
      throw new AppError(`Error al exportar documento: ${error.message}`, 500);
    }
  }

  /**
   * Exporta el documento completo a formato PDF
   * Soporta tanto el formato legacy (capitulos) como el nuevo formato HTML
   */
  static async exportarPdf(documento: any): Promise<Buffer> {
    try {
      console.log(`📄 [CANVAS] Exportando documento a PDF...`);

      // Detectar si es el nuevo formato con HTML
      const esFormatoHTML = 'indiceHTML' in documento && 'seccionesHTML' in documento;

      let buffer: Buffer;

      if (esFormatoHTML) {
        console.log(`✨ [CANVAS] Usando exportación PDF con soporte HTML completo (Puppeteer)`);

        // Convertir al formato esperado por generarPDFDesdeHTML
        const { portada, indiceHTML, seccionesHTML, nivel } = documento;

        // Mapear títulos de secciones según el nivel
        const titulosGrado1: Record<string, string> = {
          resumen: 'RESUMEN',
          introduccion: 'CAPÍTULO I: INTRODUCCIÓN',
          marco_teorico: 'CAPÍTULO II: MARCO TEÓRICO',
          metodologia: 'CAPÍTULO III: METODOLOGÍA',
          resultados: 'CAPÍTULO IV: RESULTADOS',
          conclusiones: 'CAPÍTULO V: CONCLUSIONES',
          recomendaciones: 'RECOMENDACIONES',
          referencias: 'REFERENCIAS BIBLIOGRÁFICAS'
        };

        const titulosGrado2: Record<string, string> = {
          resumen: '3. RESUMEN',
          diagnostico: '4. DIAGNÓSTICO SITUACIONAL',
          herramientas: '5. DETERMINACIÓN, INSTALACIÓN Y CONFIGURACIÓN DE LAS HERRAMIENTAS DE DESARROLLO',
          desarrollo: '6. DESARROLLO DE LA APLICACIÓN',
          pruebas: '7. FASE DE PRUEBAS',
          conclusiones: '8. CONCLUSIONES',
          recomendaciones: '9. RECOMENDACIONES',
          referencias: '10. REFERENCIAS'
        };

        const titulos = nivel === 'grado_1' ? titulosGrado1 : titulosGrado2;

        // Convertir seccionesHTML al formato esperado
        const seccionesFormateadas = seccionesHTML.map((s: any) => ({
          titulo: titulos[s.titulo] || s.titulo.toUpperCase(),
          contenidoHTML: s.contenidoHTML
        }));

        const documentoHTML = {
          portada,
          indiceHTML,
          seccionesHTML: seccionesFormateadas
        };

        // Importar la nueva función de Puppeteer
        const { generarPDFDesdeHTML } = await import('../utils/htmlToPdfGenerator');
        buffer = await generarPDFDesdeHTML(documentoHTML);

      } else {
        // Formato legacy (capitulos)
        console.log(`📝 [CANVAS] Usando exportación PDF legacy (pdfmake)`);
        buffer = await generarDocumentoPdf(documento);
      }

      console.log(`✅ [CANVAS] Documento PDF exportado exitosamente (${buffer.length} bytes)`);
      return buffer;

    } catch (error: any) {
      console.error('❌ [CANVAS] Error al exportar a PDF:', error);
      throw new AppError(`Error al exportar documento PDF: ${error.message}`, 500);
    }
  }

  /**
   * Exporta un capítulo individual a Word (para preview)
   */
  static async exportarCapitulo(capitulo: Capitulo): Promise<Buffer> {
    try {
      console.log(`📄 [CANVAS] Exportando capítulo ${capitulo.numero} a Word...`);

      const buffer = await generarCapituloIndividual(capitulo);

      console.log(`✅ [CANVAS] Capítulo exportado exitosamente`);

      return buffer;

    } catch (error: any) {
      console.error('❌ [CANVAS] Error al exportar capítulo:', error);
      throw new AppError(`Error al exportar capítulo: ${error.message}`, 500);
    }
  }

  /**
   * Genera un título académico basado en un tema
   */
  static async generarTitulo(tema: string, carrera: string, provider: 'gemini' | 'groq' = 'gemini'): Promise<string> {
    try {
      console.log(`💡 [CANVAS] Generando título para tema: "${tema}" (${carrera}) con provider: ${provider}`);

      const agente = crearAgenteTesis('rapido', provider); // Usar el proveedor especificado

      const prompt = `
Eres un experto asesor de tesis académicas.
TAREA: Genera un título de tesis profesional, académico y viable basado en el siguiente tema.

TEMA/IDEA: "${tema}"
CARRERA: ${carrera}

INSTRUCCIONES:
1. El título debe ser técnico, preciso y delimitar el alcance.
2. Evita títulos genéricos.
3. Formato sugerido: "Diseño e Implementación de...", "Análisis de...", "Propuesta de...".
4. Responde ÚNICAMENTE con el título sugerido, sin comillas ni explicaciones.
`;

      const resultado = await agente.generate([
        { role: 'user', content: prompt }
      ] as any);

      const titulo = resultado.text.trim().replace(/^"|"$/g, '');
      console.log(`✅ [CANVAS] Título generado: ${titulo}`);

      return titulo;

    } catch (error: any) {
      console.error('❌ [CANVAS] Error al generar título:', error);
      throw new AppError(`Error al generar título: ${error.message}`, 500);
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Construye el prompt para generación de índice
   */
  private static construirPromptIndice(datos: DatosGeneracionIndice): string {
    const { titulo, descripcion, carrera, tipo } = datos;

    const estructurasPorTipo: Record<string, string> = {
      desarrollo_software: `
- Capítulo I: El Problema
- Capítulo II: Marco Teórico
- Capítulo III: Marco Metodológico
- Capítulo IV: Análisis y Diseño del Sistema
- Capítulo V: Implementación y Pruebas
- Capítulo VI: Conclusiones y Recomendaciones`,
      investigacion_campo: `
- Capítulo I: El Problema
- Capítulo II: Marco Teórico
- Capítulo III: Marco Metodológico
- Capítulo IV: Análisis e Interpretación de Resultados
- Capítulo V: Conclusiones y Recomendaciones`,
      estudio_caso: `
- Capítulo I: El Problema
- Capítulo II: Marco Teórico
- Capítulo III: Marco Metodológico
- Capítulo IV: Presentación y Análisis del Caso
- Capítulo V: Conclusiones y Recomendaciones`,
      revision_literatura: `
- Capítulo I: Introducción
- Capítulo II: Metodología de Revisión
- Capítulo III: Análisis de la Literatura
- Capítulo IV: Síntesis y Discusión
- Capítulo V: Conclusiones y Recomendaciones`
    };

    return `
Eres un experto en estructuración de tesis académicas.

TAREA: Genera el índice completo (estructura de capítulos) para la siguiente tesis:

**Título**: ${titulo}
**Descripción**: ${descripcion}
**Carrera**: ${carrera}
**Tipo**: ${tipo}

ESTRUCTURA ESTÁNDAR PARA ESTE TIPO:
${estructurasPorTipo[tipo] || estructurasPorTipo.desarrollo_software}

INSTRUCCIONES:
1. Responde ÚNICAMENTE con JSON válido
2. Incluye 5-6 capítulos principales
3. Cada capítulo debe tener 3-5 subsecciones relevantes
4. Las subsecciones deben ser específicas al tema de la tesis

FORMATO JSON:
{
  "titulo_tesis": "${titulo}",
  "capitulos": [
    {
      "numero": 1,
      "titulo": "CAPÍTULO I: EL PROBLEMA",
      "subsecciones": [
        "Planteamiento del Problema",
        "Objetivos de la Investigación",
        "Justificación e Importancia",
        "Alcances y Limitaciones"
      ]
    }
  ]
}

Genera SOLO el JSON.
`;
  }

  /**
   * Construye el prompt para generación de capítulo
   */
  private static construirPromptCapitulo(datos: DatosGeneracionCapitulo): string {
    const { numeroCapitulo, tituloCapitulo, subsecciones, contextoTesis, capitulosAnteriores } = datos;

    return `
Eres un experto en redacción académica de tesis.

CONTEXTO:
- Título: ${contextoTesis.titulo}
- Descripción: ${contextoTesis.descripcion}
- Carrera: ${contextoTesis.carrera}

CAPÍTULO A GENERAR: ${tituloCapitulo}

SUBSECCIONES:
${subsecciones.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${capitulosAnteriores && capitulosAnteriores.length > 0 ? `
CAPÍTULOS ANTERIORES (para coherencia):
${capitulosAnteriores.map((c: any) => `- ${c.titulo}`).join('\n')}
` : ''}

INSTRUCCIONES:
1. Responde ÚNICAMENTE con JSON válido
2. Contenido académico y formal
3. Cada subsección: 400-600 palabras
4. Usa citas cuando sea apropiado (formato APA)

FORMATO JSON:
{
  "numero": ${numeroCapitulo},
  "titulo": "${tituloCapitulo}",
  "subsecciones": [
    {
      "titulo": "Subsección 1",
      "contenido": "Contenido completo..."
    }
  ],
  "referencias": ["Autor (Año). Título."]
}

Genera SOLO el JSON.
`;
  }

  /**
   * Parsea la respuesta JSON del agente
   */
  private static parsearRespuestaJSON(texto: string): any {
    try {
      // Intentar extraer JSON si viene con texto adicional
      const match = texto.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }

      // Si no hay match, intentar parsear directamente
      return JSON.parse(texto);

    } catch (error) {
      console.error('❌ Error al parsear JSON:', texto.substring(0, 200));
      throw new Error('La respuesta del agente no es un JSON válido');
    }
  }

  /**
   * Genera una sección de la tesis con streaming (SSE)
   */
  static async generarSeccionConStreaming(
    seccion: string,
    contexto: any,
    estructura: any,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      console.log(`📡 [CANVAS] Generando sección con streaming: ${seccion}`);

      // Crear agente - detectar provider del contexto
      const provider = (contexto as any).provider || 'gemini';
      const agente = crearAgenteTesis('canvas', provider);

      // Construir prompt según la sección
      const prompt = this.construirPromptSeccion(seccion, contexto, estructura);

      // Importar configuración de maxTokens
      const { obtenerMaxTokens } = await import('../mastra/agents');
      const maxTokens = obtenerMaxTokens(provider, 'canvas');

      console.log(`⚙️ [CANVAS] Generando sección ${seccion} con maxTokens: ${maxTokens}`);

      // Generar con streaming real usando stream
      const result = await agente.stream(
        [{ role: 'user', content: prompt }] as any,
        {
          modelSettings: {
            maxOutputTokens: maxTokens,
            temperature: 0.7
          }
        }
      );

      // Procesar el stream token por token
      for await (const chunk of result.textStream) {
        // Enviar cada token inmediatamente
        onChunk(chunk);
      }

      console.log(`✅ [CANVAS] Sección ${seccion} generada con streaming`);
      onComplete();

    } catch (error: any) {
      console.error(`❌ [CANVAS] Error al generar sección ${seccion}:`, error);
      throw new AppError(`Error al generar sección: ${error.message}`, 500);
    }
  }

  /**
   * Genera toda la tesis completa secuencialmente con streaming
   */
  static async generarTesisCompletaConStreaming(
    contexto: any,
    estructura: any,
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    // Función para post-procesar markdown a HTML
    const convertirMarkdownAHTML = (texto: string): string => {
      return texto
        // Convertir **texto** a <strong>texto</strong>
        .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
        // Convertir *texto* a <em>texto</em> (solo si no es parte de **)
        .replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>');
    };

    try {
      console.log(`📡 [CANVAS] Iniciando generación secuencial de tesis`);

      // Rastrear logs de esta sesión para mostrar resumen al final
      const sessionStartTime = Date.now();
      const sessionLogs: APICallLog[] = [];

      // Hook para capturar logs de esta sesión
      const originalLog = apiLogger.log.bind(apiLogger);
      apiLogger.log = (logEntry: APICallLog) => {
        if (logEntry.timestamp.getTime() >= sessionStartTime) {
          sessionLogs.push(logEntry);
        }
        originalLog(logEntry);
      };

      // Determinar nivel académico (default: grado_2 para tecnológico)
      const nivel = contexto.nivel || 'grado_2';
      console.log(`🎓 [CANVAS] Nivel académico: ${nivel}`);

      // Listas de secciones según nivel
      const seccionesGrado1 = [
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

      // Grado II: Proyecto Tecnológico (NO incluye introducción, marco teórico, metodología, resultados)
      const seccionesGrado2 = [
        'indice',
        'resumen',
        'diagnostico',        // 4. Diagnóstico Situacional
        'herramientas',       // 5. Herramientas de Desarrollo
        'desarrollo',         // 6. Desarrollo de la Aplicación
        'pruebas',           // 7. Fase de Pruebas
        'conclusiones',
        'recomendaciones',
        'referencias'
      ];

      const secciones = nivel === 'grado_1' ? seccionesGrado1 : seccionesGrado2;

      // Contexto acumulado para mantener coherencia
      let resumenAcumulado = '';

      // Iterar sobre cada sección
      for (let i = 0; i < secciones.length; i++) {
        const seccion = secciones[i];
        console.log(`📝 [CANVAS] Generando sección: ${seccion}`);

        // Marcador de inicio de sección
        onChunk(`---SECCION:${seccion}---\n`);

        if (seccion === 'indice') {
          // Generar índice estático sin IA
          const indiceEstatico = this.generarIndiceEstatico(contexto, estructura);
          onChunk(indiceEstatico);
          console.log(`✅ [CANVAS] Índice estático generado`);
          continue; // Pasar a la siguiente sección
        }

        // Envolver en try-catch individual para manejar errores por sección
        try {
          // Para otras secciones, usar IA con contexto acumulado
          const provider = (contexto as any).provider || 'gemini';
          const agente = crearAgenteTesis('canvas', provider);
          const prompt = this.construirPromptSeccionSecuencial(seccion, contexto, estructura, resumenAcumulado);

          // Importar configuración de maxTokens
          const { obtenerMaxTokens } = await import('../mastra/agents');
          const maxTokens = obtenerMaxTokens(provider, 'canvas');

          console.log(`⚙️ [CANVAS] Generando sección ${seccion} con maxTokens: ${maxTokens}`);

          // Función para generar con retry en caso de rate limit
          const generarConRetry = async (intentos = 3): Promise<any> => {
            for (let intento = 1; intento <= intentos; intento++) {
              try {
                return await agente.stream(
                  [{ role: 'user', content: prompt }] as any,
                  {
                    modelSettings: {
                      maxOutputTokens: maxTokens,
                      temperature: 0.7
                    }
                  }
                );
              } catch (error: any) {
                // Si es rate limit y no es el último intento, esperar y reintentar
                if (error.statusCode === 429 && intento < intentos) {
                  const waitTime = error.responseHeaders?.['retry-after']
                    ? parseInt(error.responseHeaders['retry-after']) * 1000
                    : 10000; // 10 segundos por defecto

                  console.log(`⏳ [CANVAS] Rate limit alcanzado. Esperando ${waitTime / 1000}s antes de reintentar (intento ${intento}/${intentos})...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                  continue;
                }
                throw error; // Re-lanzar si no es rate limit o es el último intento
              }
            }
            throw new Error('Máximo de reintentos alcanzado');
          };

          const result = await generarConRetry();

          let contenidoSeccion = '';

          // Procesar stream
          for await (const chunk of result.textStream) {
            // Convertir markdown a HTML antes de enviar
            const chunkHTML = convertirMarkdownAHTML(chunk);
            onChunk(chunkHTML);
            contenidoSeccion += chunkHTML;
          }

          onChunk('\n\n'); // Separador visual

          // Actualizar resumen acumulado SOLO si fue exitoso
          // OPTIMIZACIÓN: Reducir de 2000 a 500 caracteres para ahorrar tokens (~75% menos)
          const resumenSeccion = contenidoSeccion.substring(0, 500); // Primeros 500 caracteres como contexto
          resumenAcumulado += `\n--- RESUMEN ${seccion.toUpperCase()} ---\n${resumenSeccion}...\n`;

          console.log(`✅ [CANVAS] Sección ${seccion} completada`);

          // RATE LIMITING para Groq: Esperar 10 segundos entre secciones
          // Groq tiene límite de 12,000 tokens/minuto, con 6K por sección necesitamos ~10s de delay
          if (provider === 'groq' && i < secciones.length - 1) {
            console.log(`⏳ [CANVAS] Esperando 10 segundos para respetar rate limit de Groq...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }

        } catch (error: any) {
          // Manejar error específico de esta sección
          console.error(`❌ [CANVAS] Error generando sección ${seccion}:`, error);

          // Enviar marcador de error al frontend
          onChunk(`---ERROR:${seccion}---\n`);

          // Extraer mensaje de error útil
          let mensajeError = 'Error desconocido';
          if (error.message) {
            if (error.message.includes('quota') || error.message.includes('exceeded')) {
              mensajeError = 'Cuota de API agotada. Por favor, espera e intenta nuevamente más tarde.';
            } else if (error.message.includes('overloaded')) {
              mensajeError = 'Modelo sobrecargado. Por favor, intenta nuevamente en unos minutos.';
            } else {
              mensajeError = error.message;
            }
          }

          onChunk(`${mensajeError}\n\n`);

          // NO marcar como completada, NO actualizar resumen
          // Continuar con la siguiente sección
          console.log(`⚠️ [CANVAS] Saltando sección ${seccion} debido a error`);
        }

        // RATE LIMITING: Deshabilitado para Gemini 2.5 Flash
        // Gemini 2.5 Flash tiene límites mucho más altos (1500 requests/día)
        // y no requiere esperas entre secciones
        /*
        const esSegundaSolicitud = (i + 1) % 2 === 0;
        const noEsUltima = i < secciones.length - 1;

        if (esSegundaSolicitud && noEsUltima) {
          console.log(`⏳ [CANVAS] Esperando 60 segundos para respetar rate limit de API (2 solicitudes/minuto)...`);
          await new Promise(resolve => setTimeout(resolve, 60000)); // 60 segundos
        }
        */
      }

      console.log(`✅ [CANVAS] Tesis completa generada secuencialmente`);

      // Restaurar el método log original
      apiLogger.log = originalLog;

      // Mostrar resumen de la sesión
      const tituloTesis = contexto.titulo || 'Tesis';
      apiLogger.printSessionSummary(sessionLogs, `Generación de Tesis: ${tituloTesis}`);

      onComplete();

    } catch (error: any) {
      console.error(`❌ [CANVAS] Error al generar tesis completa:`, error);
      throw new AppError(`Error al generar tesis: ${error.message}`, 500);
    }
  }

  /**
   * Genera el contenido del índice de forma estática
   */
  private static generarIndiceEstatico(contexto: any, estructura: any): string {
    const nivel = contexto.nivel || 'grado_2';

    if (nivel === 'grado_1') {
      // Estructura Grado I (Investigación Clásica) - Mantenemos texto simple por ahora o actualizamos a HTML si se requiere
      return `ÍNDICE GENERAL

RESUMEN

CAPÍTULO I: EL PROBLEMA
1.1 Planteamiento del Problema
1.2 Formulación del Problema
1.3 Objetivos de la Investigación
    1.3.1 Objetivo General
    1.3.2 Objetivos Específicos
1.4 Justificación de la Investigación
1.5 Alcance y Limitaciones

CAPÍTULO II: MARCO TEÓRICO
2.1 Antecedentes de la Investigación
2.2 Bases Teóricas
2.3 Bases Legales
2.4 Definición de Términos Básicos

CAPÍTULO III: MARCO METODOLÓGICO
3.1 Tipo y Diseño de la Investigación
3.2 Población y Muestra
3.3 Técnicas e Instrumentos de Recolección de Datos
3.4 Validez y Confiabilidad
3.5 Técnicas de Análisis de Datos

CAPÍTULO IV: RESULTADOS
4.1 Presentación y Análisis de los Resultados
4.2 Discusión de los Resultados

CAPÍTULO V: CONCLUSIONES Y RECOMENDACIONES
5.1 Conclusiones
5.2 Recomendaciones

REFERENCIAS BIBLIOGRÁFICAS`;
    } else {
      // Estructura Grado II (Desarrollo Tecnológico) - EXACTA A LA IMAGEN CON FORMATO HTML PARA ALINEACIÓN
      // Usamos tabla HTML para alinear los números de página a la derecha
      return `
<h2 style="text-align: center; text-transform: uppercase;">Índice</h2>

<table class="clean-table" style="width: 100%; border-collapse: collapse; border: none;">
  <tr style="border: none;">
    <td style="border: none;"><strong>3. RESUMEN</strong></td>
    <td style="border: none; text-align: right;"><strong>5</strong></td>
  </tr>
  
  <tr style="border: none;">
    <td style="border: none;"><strong>4. Diagnóstico Situacional:</strong></td>
    <td style="border: none; text-align: right;"><strong>6</strong></td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">4.1 Descripción del contexto de la situación problemática planteada:</td>
    <td style="border: none; text-align: right;">6</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">4.2 Justificación del proyecto:</td>
    <td style="border: none; text-align: right;">7</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">4.3 Objetivos del proyecto:</td>
    <td style="border: none; text-align: right;">8</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">4.4 Procesos que se van a automatizar:</td>
    <td style="border: none; text-align: right;">8</td>
  </tr>

  <tr style="border: none;">
    <td style="border: none;"><strong>5. Determinación, Instalación y Configuración de las Herramientas de Desarrollo:</strong></td>
    <td style="border: none; text-align: right;"><strong>8</strong></td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">5.1 Plataforma de Desarrollo:</td>
    <td style="border: none; text-align: right;">9</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">5.2 Arquitectura del sistema de información:</td>
    <td style="border: none; text-align: right;">9</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">5.3 Selección del entorno del sistema:</td>
    <td style="border: none; text-align: right;">10</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">5.4 Metodología para el desarrollo:</td>
    <td style="border: none; text-align: right;">11</td>
  </tr>

  <tr style="border: none;">
    <td style="border: none;"><strong>6. Desarrollo del Sistema de Información:</strong></td>
    <td style="border: none; text-align: right;"><strong>12</strong></td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">6.1.1 Descripción:</td>
    <td style="border: none; text-align: right;">12</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">6.1.2 Requerimientos Funcionales del Proyecto:</td>
    <td style="border: none; text-align: right;">13</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">6.1.3 Requerimientos No Funcionales del Proyecto:</td>
    <td style="border: none; text-align: right;">13</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">6.1.4. Restricciones:</td>
    <td style="border: none; text-align: right;">13</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">6.2 Fase de diseño:</td>
    <td style="border: none; text-align: right;">14</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">6.3 Fase de Codificación:</td>
    <td style="border: none; text-align: right;"><strong>20</strong></td>
  </tr>
  <tr style="border: none;">
    <td class="indent-2" style="border: none;">6.3.1 Requerimientos de desarrollo:</td>
    <td style="border: none; text-align: right;">20</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-2" style="border: none;">6.3.2 Desarrollo de los módulos del sistema de información:</td>
    <td style="border: none; text-align: right;">20</td>
  </tr>

  <tr style="border: none;">
    <td style="border: none;"><strong>7. Fase de Pruebas</strong></td>
    <td style="border: none; text-align: right;"><strong>21</strong></td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">7.1. Elaboración y Ejecución del Plan de Pruebas</td>
    <td style="border: none; text-align: right;">21</td>
  </tr>
  <tr style="border: none;">
    <td class="indent-1" style="border: none;">7.2. Análisis de Resultados:</td>
    <td style="border: none; text-align: right;">22</td>
  </tr>

  <tr style="border: none;">
    <td style="border: none;"><strong>8. Conclusiones:</strong></td>
    <td style="border: none; text-align: right;"><strong>23</strong></td>
  </tr>

  <tr style="border: none;">
    <td style="border: none; padding: 4px 0;"><strong>9. Recomendaciones:</strong></td>
    <td style="border: none; padding: 4px 0; text-align: right;"><strong>23</strong></td>
  </tr>

  <tr style="border: none;">
    <td style="border: none; padding: 4px 0;"><strong>10. Referencias</strong></td>
    <td style="border: none; padding: 4px 0; text-align: right;"><strong>24</strong></td>
  </tr>
</table>`;
    }
  }

  /**
   * Construye el prompt para una sección específica en el flujo secuencial
   */
  private static construirPromptSeccionSecuencial(
    seccion: string,
    contexto: any,
    estructura: any,
    resumenPrevio: string
  ): string {
    const { titulo, descripcion, carrera, tipo } = contexto;

    const instruccionesPorSeccion: Record<string, string> = {
      // Comunes
      resumen: `Escribe la sección '3. RESUMEN'.
REQUISITOS OBLIGATORIOS:
- DEBE COMENZAR con el título completo de la tesis
- Máximo 150 palabras
- Incluir: objetivo del informe, limitaciones/problemáticas del sistema actual, metodología de desarrollo, tecnologías utilizadas, objetivo general
- Al final, agregar 4 DESCRIPTORES (palabras clave) que describan el sistema
- Incluir al menos 2 referencias bibliográficas del 2010 en adelante relacionadas con el título`,

      // Grado I
      introduccion: `Escribe el Capítulo I: Introducción.
REQUISITOS:
- Máximo 1 página
- Incluye planteamiento del problema, objetivos y justificación.`,

      marco_teorico: "Escribe el Capítulo II: Marco Teórico. Desarrolla antecedentes, bases teóricas y legales con referencias bibliográficas del 2010 en adelante.",

      metodologia: "Escribe el Capítulo III: Metodología. Define tipo de investigación, diseño, población y técnicas.",

      resultados: "Escribe el Capítulo IV: Resultados. Presenta el análisis de los resultados.",

      conclusiones: `Escribe el Capítulo V: Conclusiones.
REQUISITOS:
- DEBE COMENZAR con el título del sistema
- Máximo 1 página
- Conclusiones normales después del título`,

      recomendaciones: "Escribe las Recomendaciones basadas en los resultados y conclusiones.",

      referencias: "Genera la lista de Referencias Bibliográficas en formato APA. Mínimo 2 referencias del 2010 en adelante.",

      // Grado II (Títulos exactos de la imagen)
      diagnostico: `Escribe la sección '4. Diagnóstico Situacional'.
REQUISITOS OBLIGATORIOS:
- DEBE incluir al menos 1 referencia bibliográfica
Debes desarrollar los siguientes puntos:
4.1 Descripción del contexto de la situación problemática planteada
4.2 Justificación del proyecto (DEBE COMENZAR con el título del sistema + agregar 1 referencia)
4.3 Objetivos del proyecto (Objetivos específicos DEBEN usar verbos: analizar, investigar, establecer, diseñar, desarrollar)
4.4 Procesos que se van a automatizar (DEBE COMENZAR con el título del sistema)`,

      herramientas: `Escribe la sección '5. Determinación, Instalación y Configuración de las Herramientas de Desarrollo'.
REQUISITOS OBLIGATORIOS:
Debes desarrollar los siguientes puntos:
5.1 Plataforma de Desarrollo
5.2 Arquitectura del sistema de información (DEBE incluir descripción de diagrama Cliente-Servidor)
5.3 Selección del entorno del sistema
5.4 Metodología para el desarrollo (Categorizar metodologías: sistemas educativos ≠ sistemas de información)`,

      desarrollo: `Escribe la sección '6. Desarrollo del Sistema de Información'.
REQUISITOS OBLIGATORIOS:
Debes desarrollar los siguientes puntos:
6.1.1 Descripción
6.1.2 Requerimientos Funcionales del Proyecto (lista detallada)
6.1.3 Requerimientos No Funcionales del Proyecto (lista detallada)
6.1.4 Restricciones (del sistema)
6.2 Fase de diseño (mencionar: diagrama de casos de uso con avatares, diagrama de procesos del sistema propuesto, diagrama entidad-relación de BD, mínimo 4 capturas de interfaces con descripción de funciones)
6.3 Fase de Codificación (mencionar: mínimo 2 capturas de código con descripción, incluir captura del código generador de PDF)
6.3.1 Requerimientos de desarrollo
6.3.2 Desarrollo de los módulos del sistema de información`,

      pruebas: `Escribe la sección '7. Fase de Pruebas'.
Debes desarrollar los siguientes puntos:
7.1 Elaboración y Ejecución del Plan de Pruebas
7.2 Análisis de Resultados`,

      // Sobreescritura para Grado II (si se usa el mismo key)
      // Para evitar conflictos, usaremos lógica condicional en el prompt si fuera necesario, 
      // pero como las keys son únicas o compartidas, ajustamos las compartidas.
      // 'conclusiones' y 'recomendaciones' son compartidas pero tienen números distintos.
      // La IA es inteligente, le daremos el número en el prompt.
    };

    // Ajuste dinámico para Conclusiones/Recomendaciones/Referencias según nivel
    const nivel = contexto.nivel || 'grado_2';
    if (nivel === 'grado_2') {
      instruccionesPorSeccion['conclusiones'] = "Escribe la sección '8. Conclusiones'.";
      instruccionesPorSeccion['recomendaciones'] = "Escribe la sección '9. Recomendaciones'.";
      instruccionesPorSeccion['referencias'] = "Escribe la sección '10. Referencias'. Lista bibliográfica en formato APA.";
    }

    return `Eres un experto redactor de tesis académicas. Estás escribiendo la tesis titulada: "${titulo}".

CONTEXTO DEL PROYECTO:
- Descripción: ${descripcion}
- Carrera: ${carrera}
- Tipo: ${tipo}

ESTADO ACTUAL DE LA ESCRITURA:
Ya se han escrito las secciones anteriores. Aquí tienes un extracto del contenido previo para mantener la coherencia:
${resumenPrevio}

TAREA ACTUAL:
Escribe el contenido para la sección: "${seccion.toUpperCase()}".

INSTRUCCIONES ESPECÍFICAS:
${instruccionesPorSeccion[seccion] || "Desarrolla el contenido académico apropiado para esta sección."}

REQUISITOS DE FORMATO:
1. Usa formato HTML limpio y semántico.
2. IMPORTANTE: Usa <h2> para títulos principales de sección (ej: "4. Diagnóstico Situacional").
3. IMPORTANTE: Usa <h3> para subsecciones (ej: "4.1 Descripción del contexto...").
4. Usa <p> para cada párrafo. Los párrafos deben ser extensos y académicos.
5. Usa <strong> para resaltar conceptos clave y términos importantes dentro del texto.
6. Usa <ul> y <li> para listas con viñetas cuando sea apropiado.
7. Usa <ol> y <li> para listas numeradas cuando sea apropiado.
8. El texto debe ser justificado, formal y académico.
9. Mantén coherencia total con lo escrito anteriormente.
10. NO inventes datos contradictorios con el resumen previo.
11. NO incluyas saludos ni explicaciones ("Aquí está la sección..."). Empieza directamente con el contenido HTML.
12. CRÍTICO: NO escapes el HTML. Genera HTML real, NO texto que muestre las etiquetas.
13. CRÍTICO: NO uses bloques de código markdown. NUNCA envuelvas el HTML en triple comilla invertida. Genera HTML directamente sin ningún wrapper de código.

**PROHIBIDO USAR MARKDOWN:**
- NUNCA uses **doble asterisco** para negritas → USA <strong>texto</strong>
- NUNCA uses *asterisco simple* para cursivas → USA <em>texto</em>
- NUNCA uses # para títulos → USA <h2>, <h3>, <h4>
- NUNCA uses - o * para listas → USA <ul><li>
- SOLO genera HTML puro, NUNCA markdown

14. EJEMPLO COMPLETO DE FORMATO CORRECTO (COPIA ESTE ESTILO):

<h2>3. RESUMEN</h2>

<p>La presente tesis aborda la problemática de la gestión manual y descentralizada de los proyectos de tesis de grado en la carrera de Ingeniería en Informática, un proceso caracterizado por su lentitud, falta de transparencia y propensión a errores administrativos. El <strong>objetivo principal</strong> de esta investigación fue diseñar, desarrollar e implementar un sistema web integral que automatice y optimice el ciclo de vida de las propuestas de tesis, desde su presentación inicial por parte del estudiante hasta su aceptación formal por parte del comité académico.</p>

<p>Para la consecución de este objetivo, se empleó una <strong>metodología de desarrollo ágil</strong>, específicamente Scrum, que facilitó la construcción incremental y adaptativa del software, permitiendo ajustes continuos basados en la retroalimentación de los usuarios clave. La arquitectura del sistema se fundamentó en el patrón <strong>Modelo-Vista-Controlador (MVC)</strong>, utilizando un conjunto de tecnologías modernas y robustas: PHP con el framework Laravel para el desarrollo del backend, MySQL como sistema de gestión de bases de datos relacional, y JavaScript con el framework Vue.js para la creación de una interfaz de usuario dinámica, reactiva e intuitiva en el frontend.</p>

15. EJEMPLO DE FORMATO INCORRECTO (NUNCA HAGAS ESTO):
&lt;h2&gt;3. RESUMEN&lt;/h2&gt;
&lt;p&gt;La presente tesis...&lt;/p&gt;

O PEOR AÚN (NUNCA HAGAS ESTO):
3. RESUMEN
La presente tesis aborda la problemática...



Genera el contenido ahora:`;
  }

  /**
   * Construye el prompt para una sección específica (método legacy)
   */
  private static construirPromptSeccion(seccion: string, contexto: any, estructura: any): string {
    const { titulo, descripcion, carrera, tipo, contenidoPrevio } = contexto;

    // Construir resumen del contenido previo si existe
    let contextoPrevio = '';
    if (contenidoPrevio && Object.keys(contenidoPrevio).length > 0) {
      contextoPrevio = '\n\nCONTENIDO GENERADO PREVIAMENTE (para mantener coherencia):\n';
      for (const [seccionPrevia, contenido] of Object.entries(contenidoPrevio)) {
        if (contenido) {
          contextoPrevio += `\n--- ${seccionPrevia.toUpperCase()} ---\n${contenido}\n`;
        }
      }
    }

    return `Genera SOLO el contenido de la sección "${seccion}" para una tesis académica.

**INFORMACIÓN:**
- Título: ${titulo}
- Descripción: ${descripcion}
- Carrera: ${carrera}
${contextoPrevio}

**INSTRUCCIONES:**
1. Genera SOLO el contenido de esta sección
2. NO incluyas explicaciones como "Claro, aquí tienes..."
3. NO cites tesis al final
4. Usa formato HTML limpio y semántico
5. Mantén coherencia con el contenido previo
6. IMPORTANTE: Usa <h2> para títulos principales y <h3> para subsecciones
7. Usa <p> para párrafos y <strong> para conceptos clave
8. CRÍTICO: NO escapes el HTML. Genera HTML real, NO texto que muestre las etiquetas

9. EJEMPLO COMPLETO (COPIA ESTE ESTILO):

<h2>3. RESUMEN</h2>

<p>La presente tesis aborda la problemática de la gestión manual y descentralizada de los proyectos de tesis de grado en la carrera de Ingeniería en Informática, un proceso caracterizado por su lentitud, falta de transparencia y propensión a errores administrativos. El <strong>objetivo principal</strong> de esta investigación fue diseñar, desarrollar e implementar un sistema web integral que automatice y optimice el ciclo de vida de las propuestas de tesis.</p>

<p>Para la consecución de este objetivo, se empleó una <strong>metodología de desarrollo ágil</strong>, específicamente Scrum, que facilitó la construcción incremental y adaptativa del software.</p>

Genera el contenido ahora:`;
  }
}
