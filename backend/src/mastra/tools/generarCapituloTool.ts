import { Tool } from '@mastra/core';
import { z } from 'zod';
import { TesisReferenciaModel } from '../../models/TesisReferencia';

/**
 * Herramienta para generar un capítulo específico de una tesis
 * Genera contenido detallado basándose en el índice y contexto del proyecto
 */
export const generarCapituloTool = new Tool({
    id: 'generarCapitulo',
    description: 'Genera el contenido completo de un capítulo específico de una tesis académica',
    inputSchema: z.object({
        numeroCapitulo: z.number().describe('Número del capítulo a generar (1-6)'),
        tituloCapitulo: z.string().describe('Título del capítulo'),
        subsecciones: z.array(z.string()).describe('Lista de subsecciones del capítulo'),
        contextoTesis: z.object({
            titulo: z.string(),
            descripcion: z.string(),
            carrera: z.string(),
            tipo: z.string()
        }).describe('Contexto general de la tesis'),
        capitulosAnteriores: z.array(z.any()).optional().describe('Contenido de capítulos anteriores para mantener coherencia')
    }),
    execute: async ({ context }) => {
        const { numeroCapitulo, tituloCapitulo, subsecciones, contextoTesis, capitulosAnteriores } = context;

        // 1. Buscar tesis similares para usar como referencia
        console.log(`🔍 [GENERAR CAPITULO] Buscando tesis de referencia para: ${contextoTesis.titulo}`);
        // Solo buscamos 1 tesis pero con todo el detalle
        let tesisReferencia = await TesisReferenciaModel.buscar(contextoTesis.titulo, contextoTesis.carrera, 1);

        if (tesisReferencia.length === 0) {
            console.log(`⚠️ No se encontraron coincidencias exactas. Buscando por carrera: ${contextoTesis.carrera}`);
            tesisReferencia = await TesisReferenciaModel.buscarPorCarrera(contextoTesis.carrera, 1);
        }

        const referenciasContexto = tesisReferencia.map(t =>
            `- Título: "${t.titulo}"\n  Autor: ${t.autor}\n  Resumen: ${t.resumen}\n  CONTENIDO COMPLETO DE REFERENCIA:\n  ${t.contenido_completo?.substring(0, 15000) || 'Contenido no disponible'}`
        ).join('\n\n');

        // Prompts específicos según el tipo de capítulo (SIN ASTERISCOS)
        const promptsEspecificos: Record<number, string> = {
            1: `
Este es el CAPÍTULO I: EL PROBLEMA. Debes incluir:
- Planteamiento del Problema: Describe la situación problemática, causas y consecuencias
- Objetivos: General y específicos (usar verbos en infinitivo: Analizar, Diseñar, Desarrollar, Implementar)
- Justificación: Por qué es importante resolver este problema
- Alcances y Limitaciones: Qué incluye y qué no incluye el proyecto
`,
            2: `
Este es el CAPÍTULO II: MARCO TEÓRICO. Debes incluir:
- Antecedentes: Investigaciones previas relacionadas (mínimo 3 trabajos)
- Bases Teóricas: Conceptos fundamentales, teorías y modelos relevantes
- Bases Legales (si aplica): Leyes, normas o reglamentos relacionados
- Definición de Términos: Glosario de términos técnicos clave
`,
            3: `
Este es el CAPÍTULO III: MARCO METODOLÓGICO. Debes incluir:
- Tipo y Diseño de Investigación: Descriptiva, aplicada, proyecto factible, etc.
- Población y Muestra (si aplica): Usuarios, beneficiarios
- Técnicas e Instrumentos: Entrevistas, encuestas, observación
- Metodología de Desarrollo (para software): Scrum, Cascada, XP, etc.
- Fases del Proyecto: Etapas de desarrollo
`,
            4: `
Este es el CAPÍTULO IV: ANÁLISIS Y DISEÑO / RESULTADOS. Debes incluir:
${contextoTesis.tipo === 'desarrollo_software' ? `
- Análisis del Sistema Actual: Situación actual, problemas identificados
- Requerimientos Funcionales y No Funcionales: Qué debe hacer el sistema
- Casos de Uso: Diagramas y descripciones
- Diseño de la Base de Datos: Modelo entidad-relación
- Diseño de Interfaces: Mockups o wireframes (descripción)
- Arquitectura del Sistema: Componentes y su interacción
` : `
- Presentación de Resultados: Datos obtenidos, tablas, gráficos
- Análisis de Resultados: Interpretación de los datos
- Discusión: Comparación con antecedentes y teorías
`}
`,
            5: `
Este es el CAPÍTULO V: IMPLEMENTACIÓN Y PRUEBAS / CONCLUSIONES. Debes incluir:
${contextoTesis.tipo === 'desarrollo_software' ? `
- Herramientas y Tecnologías Utilizadas: Lenguajes, frameworks, librerías
- Proceso de Implementación: Cómo se desarrolló el sistema
- Pruebas del Sistema: Plan de pruebas, casos de prueba, resultados
- Manual de Usuario (resumen): Cómo usar el sistema
` : `
- Conclusiones: Respuestas a los objetivos planteados
- Recomendaciones: Sugerencias para futuras investigaciones
- Aportes de la Investigación: Contribución al conocimiento
`}
`,
            6: `
Este es el CAPÍTULO VI: CONCLUSIONES Y RECOMENDACIONES. Debes incluir:
- Conclusiones: Una conclusión por cada objetivo específico
- Recomendaciones: Sugerencias para mejorar o extender el proyecto
- Trabajos Futuros: Líneas de investigación derivadas
`
        };

        const promptEspecifico = promptsEspecificos[numeroCapitulo] || '';

        const prompt = `
Eres un experto en redacción de tesis académicas con estilo formal y académico.

CONTEXTO DE LA TESIS:
Título: ${contextoTesis.titulo}
Descripción: ${contextoTesis.descripcion}
Carrera: ${contextoTesis.carrera}
Tipo: ${contextoTesis.tipo}

TESIS DE REFERENCIA REALES (ÚSALAS COMO GUÍA DE ESTILO Y ENFOQUE):
${referenciasContexto || 'No se encontraron tesis similares directas, usa estándares académicos generales.'}

CAPÍTULO A GENERAR:
${tituloCapitulo}

SUBSECCIONES REQUERIDAS:
${subsecciones.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${promptEspecifico}

${capitulosAnteriores && capitulosAnteriores.length > 0 ? `
CONTEXTO DE CAPÍTULOS ANTERIORES (para mantener coherencia):
${capitulosAnteriores.map((cap: any) => `- ${cap.titulo}: ${cap.contenido?.substring(0, 200)}...`).join('\n')}
` : ''}

INSTRUCCIONES CRÍTICAS:
1. Responde ÚNICAMENTE con un objeto JSON válido
2. El contenido debe ser académico, formal y coherente
3. Usa citas y referencias cuando sea apropiado (formato APA)
4. Cada subsección debe tener al menos 300-500 palabras
5. Mantén coherencia con los capítulos anteriores
6. BASATE en las tesis de referencia para el tono y profundidad

FORMATO DE RESPUESTA (JSON):
{
  "numero": ${numeroCapitulo},
  "titulo": "${tituloCapitulo}",
  "subsecciones": [
    {
      "titulo": "${subsecciones[0] || 'Subsección 1'}",
      "contenido": "Texto completo de la subsección con párrafos bien estructurados..."
    }
    // ... una entrada por cada subsección
  ],
  "referencias": [
    "Autor, A. (Año). Título. Editorial.",
    "..."
  ]
}

Genera SOLO el JSON, sin explicaciones adicionales.
`;

        return {
            prompt,
            requiresJsonResponse: true
        };
    }
});
