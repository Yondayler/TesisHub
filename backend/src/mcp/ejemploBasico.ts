/**
 * EJEMPLO BÁSICO: Cómo usar MCP de Mastra
 * 
 * Este archivo muestra ejemplos prácticos de cómo usar MCPClient
 * para conectar a servidores MCP externos.
 */

import { MCPClient } from "@mastra/mcp";

// ============================================
// EJEMPLO 1: Cliente MCP Básico con Wikipedia
// ============================================

export const mcpClientBasico = new MCPClient({
  id: "tesis-hub-basico",
  servers: {
    // Servidor MCP de Wikipedia (gratis, sin API key)
    wikipedia: {
      command: "npx",
      args: ["-y", "wikipedia-mcp"],
    },
  },
});

// Cómo usar:
// const tools = await mcpClientBasico.getTools();
// Luego pasar estas herramientas a un agente de Mastra

// ============================================
// EJEMPLO 2: Cliente MCP con Múltiples Servidores
// ============================================

export const mcpClientCompleto = new MCPClient({
  id: "tesis-hub-completo",
  servers: {
    wikipedia: {
      command: "npx",
      args: ["-y", "wikipedia-mcp"],
    },
    // Puedes agregar más servidores aquí
    // weather: {
    //   url: new URL("https://server.smithery.ai/@smithery-ai/national-weather-service/mcp?api_key=TU_API_KEY"),
    // },
  },
});

// ============================================
// EJEMPLO 3: Función Helper para Obtener Herramientas
// ============================================

/**
 * Obtiene las herramientas de los servidores MCP configurados
 * Útil para pasar a un agente de Mastra
 */
export async function obtenerHerramientasMCP() {
  try {
    const tools = await mcpClientBasico.getTools();
    console.log(`✅ Obtenidas ${tools.length} herramientas de servidores MCP`);
    return tools;
  } catch (error) {
    console.error("❌ Error al obtener herramientas MCP:", error);
    // Retornar array vacío si falla (fallback)
    return [];
  }
}

// ============================================
// EJEMPLO 4: Uso con Agente (comentado - requiere @mastra/gemini)
// ============================================

/*
import { Agent } from "@mastra/core/agent";
import { gemini } from "@mastra/gemini";
import { config } from "../config/env";

export async function crearAgenteConMCP() {
  const tools = await obtenerHerramientasMCP();
  
  const agente = new Agent({
    name: "Asistente de Tesis con MCP",
    description: "Asistente académico con acceso a Wikipedia y otras fuentes",
    instructions: `
      Eres un asistente académico especializado en tesis y proyectos de investigación.
      Tienes acceso a Wikipedia para buscar información y referencias académicas.
      Siempre cita tus fuentes.
    `,
    model: gemini("gemini-1.5-flash", {
      apiKey: config.geminiApiKey,
    }),
    tools: tools, // Herramientas de MCP
  });

  return agente;
}

// Uso:
// const agente = await crearAgenteConMCP();
// const respuesta = await agente.generate("¿Qué es una tesis doctoral?");
*/

// ============================================
// NOTAS IMPORTANTES:
// ============================================
// 
// 1. Para usar con un agente, necesitas instalar:
//    npm install @mastra/gemini
//
// 2. Las herramientas MCP se obtienen de forma asíncrona
//    Siempre usa await al llamar getTools()
//
// 3. Si un servidor MCP falla, el cliente puede seguir funcionando
//    con los otros servidores disponibles
//
// 4. Para producción, considera manejar errores y timeouts
//
// 5. Algunos servidores MCP requieren API keys (como weather)
//    Otros son gratuitos (como wikipedia-mcp)


