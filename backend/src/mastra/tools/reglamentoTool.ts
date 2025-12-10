import { createTool } from "@mastra/core";
import { z } from "zod";

// Base de conocimientos simulada (Vector Store Mock)
const REGLAMENTO_DB = [
    {
        tema: "APA",
        contenido: "Normas APA 7ma Edición: \n- Margen: 2.54 cm en todos los lados.\n- Fuente: Times New Roman 12pt, Arial 11pt, o Calibri 11pt.\n- Interlineado: Doble espacio.\n- Alineación: Izquierda (sin justificar).\n- Sangría: 1.27 cm en la primera línea de cada párrafo.\n- Numeración: Esquina superior derecha."
    },
    {
        tema: "Estructura",
        contenido: "Estructura Oficial de la Tesis:\n1. Portada\n2. Dedicatoria y Agradecimientos (Opcional)\n3. Índice General\n4. Resumen (Abstract)\n5. Introducción\n6. Capítulo I: El Problema\n7. Capítulo II: Marco Teórico\n8. Capítulo III: Marco Metodológico\n9. Capítulo IV: Resultados y Análisis\n10. Conclusiones y Recomendaciones\n11. Referencias Bibliográficas"
    },
    {
        tema: "Requisitos",
        contenido: "Requisitos de Aprobación:\n- Asistencia mínima del 75% a las tutorías.\n- Aprobación del tutor académico.\n- Entrega de 3 tomos empastados.\n- Defensa oral ante jurado (45 minutos)."
    },
    {
        tema: "Citas",
        contenido: "Citas en el texto (APA 7):\n- Cita textual corta (<40 palabras): Entre comillas y con número de página. Ej: (Pérez, 2023, p. 15).\n- Cita textual larga (>40 palabras): Bloque aparte, sin comillas, sangría de 1.27 cm.\n- Parafraseo: Solo apellido y año. Ej: (Gómez, 2022)."
    }
];

export const consultarReglamentoTool = createTool({
    id: "consultarReglamento",
    inputSchema: z.object({
        consulta: z.string().describe("El tema o pregunta específica sobre el reglamento o normas (ej: 'márgenes APA', 'estructura de la tesis')"),
    }),
    description: "Busca información oficial en el Reglamento de Tesis y Normas APA. Úsala SIEMPRE que el usuario pregunte sobre formatos, reglas, requisitos, márgenes, citas o estructura de la universidad. NO inventes normas, usa solo lo que devuelve esta herramienta.",
    execute: async ({ context: { consulta } }) => {
        console.log(`📚 RAG Tool: Buscando en reglamento sobre "${consulta}"...`);

        const query = consulta.toLowerCase();

        // Simulación de búsqueda semántica (búsqueda por palabras clave simple)
        const resultados = REGLAMENTO_DB.filter(item => {
            const contenido = item.contenido.toLowerCase();
            const tema = item.tema.toLowerCase();
            return contenido.includes(query) || tema.includes(query) || query.includes(tema);
        });

        if (resultados.length === 0) {
            // Si no hay match exacto, devolver todo el contexto de APA y Estructura por si acaso
            return {
                mensaje: "No encontré una sección exacta, pero aquí tienes las normas generales:",
                contexto: REGLAMENTO_DB.slice(0, 2)
            };
        }

        return {
            resultados_encontrados: resultados.length,
            contexto: resultados
        };
    }
});
