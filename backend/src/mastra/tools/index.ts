import { createTool } from "@mastra/core";
import { TesisReferenciaModel } from "../../models/TesisReferencia";
import { z } from "zod";

export const buscarTesisTool = createTool({
  id: "buscarTesis",
  inputSchema: z.object({
    consulta: z.string().describe("La consulta de búsqueda, tema o palabras clave"),
    carrera: z.string().optional().describe("Filtro opcional por carrera (ej: Ingeniería de Sistemas)"),
  }),
  description: "Busca tesis académicas en la base de datos local para usarlas como referencia. Úsala cuando el usuario pregunte sobre ejemplos, estructura o contenido académico. Si el usuario pregunta 'qué tesis tienes', usa una consulta vacía o genérica.",
  execute: async ({ context: { consulta, carrera } }) => {
    console.log(`🔍 Mastra Tool: Buscando tesis sobre "${consulta}"${carrera ? ` en ${carrera}` : ''}...`);
    let tesis = await TesisReferenciaModel.buscar(consulta, carrera, 5);
    let mensaje = "";
    let tipo_resultado = "exacto";

    // FALLBACK AUTOMÁTICO: Si no hay resultados, buscar alternativas reales
    if (tesis.length === 0) {
      console.log("⚠️ No se encontraron resultados exactos. Ejecutando estrategia de fallback...");

      if (carrera) {
        // Estrategia 1: Buscar cualquier tesis de la misma carrera
        console.log(`🔄 Fallback 1: Buscando cualquier tesis de ${carrera}...`);
        tesis = await TesisReferenciaModel.buscarPorCarrera(carrera, 5);
        if (tesis.length > 0) {
          mensaje = `NO se encontraron tesis exactas sobre "${consulta}", pero encontré estas tesis de ${carrera} que DEBES usar como referencia metodológica:`;
          tipo_resultado = "carrera_similar";
        }
      }

      if (tesis.length === 0) {
        // Estrategia 2: Buscar tesis recientes de cualquier área (Sistemas/Informática preferiblemente)
        console.log("🔄 Fallback 2: Buscando tesis recientes generales...");
        // Usamos buscar con query vacía para traer las más recientes
        tesis = await TesisReferenciaModel.buscar("", undefined, 5);
        mensaje = `NO se encontraron tesis sobre "${consulta}". Aquí tienes las tesis más recientes de la base de datos. ÚSALAS como referencia para estructura y metodología:`;
        tipo_resultado = "generico";
      }
    } else {
      mensaje = `Se encontraron ${tesis.length} tesis relacionadas con "${consulta}".`;
    }

    return {
      resultados_encontrados: tesis.length,
      tipo_resultado: tipo_resultado,
      mensaje: mensaje,
      tesis: tesis.map(t => ({
        id: t.id,
        titulo: t.titulo,
        autor: t.autor,
        año: t.año,
        resumen: t.resumen,
        carrera: t.carrera
      }))
    };
  }
});

export * from './reglamentoTool';
export * from './generarIndiceTool';
export * from './generarCapituloTool';


export const leerTesisTool = createTool({
  id: "leerTesis",
  inputSchema: z.object({
    id: z.number().describe("El ID de la tesis que se quiere leer"),
  }),
  description: "Obtiene el contenido completo y detallado de una tesis específica por su ID. Úsala para analizar en profundidad la estructura, metodología o redacción de una tesis exitosa.",
  execute: async ({ context: { id } }) => {
    console.log(`📖 Mastra Tool: Leyendo tesis ID ${id}...`);
    const tesis = await TesisReferenciaModel.obtenerPorId(id);

    if (!tesis) {
      return {
        error: `TESIS NO ENCONTRADA: El ID ${id} NO EXISTE en la base de datos. NO inventes información sobre esta tesis. Solo puedes citar tesis que realmente existen.`,
        tesis_existe: false,
        id_buscado: id
      };
    }

    return {
      tesis_existe: true,
      titulo: tesis.titulo,
      autor: tesis.autor,
      año: tesis.año,
      carrera: tesis.carrera,
      universidad: tesis.universidad,
      resumen: tesis.resumen,
      metodologia: tesis.metodologia,
      contenido_completo: tesis.contenido_completo,
      estructura: {
        planteamiento: "Disponible en contenido completo",
        objetivos: "Disponible en contenido completo",
        resultados: "Disponible en contenido completo"
      }
    };
  }
});

export const listarCarrerasTool = createTool({
  id: "listarCarreras",
  inputSchema: z.object({}),
  description: "Lista todas las carreras disponibles en la base de datos de tesis. Úsala para saber qué carreras tienen tesis disponibles y poder hacer búsquedas más precisas.",
  execute: async () => {
    console.log(`📚 Mastra Tool: Listando carreras disponibles...`);
    const stats = await TesisReferenciaModel.obtenerEstadisticas();
    return {
      carreras: stats.por_carrera.map(c => ({
        nombre: c.carrera,
        cantidad_tesis: c.count
      })),
      total_carreras: stats.por_carrera.length
    };
  }
});

export const buscarPorCarreraTool = createTool({
  id: "buscarPorCarrera",
  inputSchema: z.object({
    carrera: z.string().describe("Nombre exacto de la carrera"),
    limit: z.number().optional().default(10).describe("Número máximo de tesis a retornar")
  }),
  description: "Busca todas las tesis de una carrera específica. Úsala cuando quieras ver ejemplos de tesis de una carrera en particular, sin filtrar por tema específico.",
  execute: async ({ context: { carrera, limit } }) => {
    console.log(`🎓 Mastra Tool: Buscando tesis de ${carrera}...`);
    const tesis = await TesisReferenciaModel.buscarPorCarrera(carrera, limit);

    return tesis.map(t => ({
      id: t.id,
      titulo: t.titulo,
      autor: t.autor,
      año: t.año,
      resumen: t.resumen,
      carrera: t.carrera
    }));
  }
});

export const obtenerEstadisticasTool = createTool({
  id: "obtenerEstadisticas",
  inputSchema: z.object({}),
  description: "Obtiene estadísticas generales de la base de datos: total de tesis, carreras disponibles y áreas de conocimiento. Úsala cuando el usuario pregunte '¿qué tesis tienes?' o para orientarte sobre qué hay disponible.",
  execute: async () => {
    console.log(`📊 Mastra Tool: Obteniendo estadísticas de la BD...`);
    const stats = await TesisReferenciaModel.obtenerEstadisticas();

    return {
      total_tesis: stats.total,
      carreras_disponibles: stats.por_carrera.map(c => `${c.carrera} (${c.count} tesis)`),
      areas_conocimiento: stats.por_area.map(a => `${a.area} (${a.count} tesis)`)
    };
  }
});
