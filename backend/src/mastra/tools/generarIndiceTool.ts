import { Tool } from '@mastra/core';
import { z } from 'zod';

/**
 * Herramienta para generar el índice completo de una tesis
 * Genera la estructura de capítulos basándose en el tema y tipo de tesis
 */
export const generarIndiceTool = new Tool({
    id: 'generarIndice',
    description: 'Genera el índice completo (estructura de capítulos) de una tesis académica basándose en el tema y tipo de proyecto',
    inputSchema: z.object({
        titulo: z.string().describe('Título de la tesis'),
        descripcion: z.string().describe('Descripción breve del proyecto de tesis'),
        carrera: z.string().describe('Carrera o programa académico'),
        tipo: z.enum(['desarrollo_software', 'investigacion_campo', 'estudio_caso', 'revision_literatura']).describe('Tipo de tesis')
    }),
    execute: async ({ context }) => {
        const { titulo, descripcion, carrera, tipo } = context;

        // Construir prompt específico para generación de índice
        const prompt = `
Eres un experto en estructuración de tesis académicas. 

TAREA: Genera el índice completo (estructura de capítulos) para la siguiente tesis:

**Título**: ${titulo}
**Descripción**: ${descripcion}
**Carrera**: ${carrera}
**Tipo**: ${tipo}

INSTRUCCIONES CRÍTICAS:
1. Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional
2. La estructura debe seguir las normas académicas estándar
3. Incluye entre 5-6 capítulos principales
4. Cada capítulo debe tener subsecciones relevantes (2-4 subsecciones)

FORMATO DE RESPUESTA (JSON):
{
  "titulo_tesis": "${titulo}",
  "capitulos": [
    {
      "numero": 1,
      "titulo": "CAPÍTULO I: EL PROBLEMA",
      "subsecciones": [
        "Planteamiento del Problema",
        "Objetivos de la Investigación",
        "Justificación e Importancia"
      ]
    },
    {
      "numero": 2,
      "titulo": "CAPÍTULO II: MARCO TEÓRICO",
      "subsecciones": [
        "Antecedentes de la Investigación",
        "Bases Teóricas",
        "Definición de Términos Básicos"
      ]
    }
    // ... continúa con los demás capítulos
  ]
}

CAPÍTULOS ESTÁNDAR SEGÚN TIPO:
${tipo === 'desarrollo_software' ? `
- Capítulo I: El Problema
- Capítulo II: Marco Teórico
- Capítulo III: Marco Metodológico
- Capítulo IV: Análisis y Diseño del Sistema
- Capítulo V: Implementación y Pruebas
- Capítulo VI: Conclusiones y Recomendaciones
` : tipo === 'investigacion_campo' ? `
- Capítulo I: El Problema
- Capítulo II: Marco Teórico
- Capítulo III: Marco Metodológico
- Capítulo IV: Análisis e Interpretación de Resultados
- Capítulo V: Conclusiones y Recomendaciones
` : `
- Capítulo I: El Problema
- Capítulo II: Marco Teórico
- Capítulo III: Marco Metodológico
- Capítulo IV: Resultados
- Capítulo V: Conclusiones y Recomendaciones
`}

Genera SOLO el JSON, sin explicaciones adicionales.
`;

        return {
            prompt,
            requiresJsonResponse: true
        };
    }
});
