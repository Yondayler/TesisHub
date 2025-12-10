# 📚 Guía de Uso: MCP de Mastra

Esta guía explica cómo usar MCP (Model Context Protocol) de Mastra en tu proyecto TesisHub.

---

## 🎯 Dos Formas de Usar MCP

### 1️⃣ **MCP en Cursor (Documentación)**
El servidor `mastra-docs` en `.cursor/mcp.json` te permite acceder a la documentación de Mastra directamente desde Cursor.

**Cómo usarlo:**
- Reinicia Cursor para que el servidor MCP esté disponible
- Cuando estés escribiendo código, puedes preguntar a Cursor sobre Mastra
- Ejemplo: "¿Cómo crear un agente con Mastra?" o "Muéstrame ejemplos de MCPClient"

---

### 2️⃣ **MCP en tu Código (Backend)**
Usa `@mastra/mcp` para conectar tu aplicación a servidores MCP externos y usar sus herramientas.

---

## 🚀 Integración de MCP en tu Chat Service

Actualmente tu `chatService.ts` usa Gemini directamente. Con MCP puedes:

1. **Conectar a servidores MCP externos** (Wikipedia, Weather, etc.)
2. **Exponer tus propias herramientas** como servidor MCP
3. **Usar herramientas de otros servidores** en tus agentes

---

## 📝 Ejemplo 1: Usar MCPClient con un Agente

### Paso 1: Crear un MCPClient

Crea el archivo `backend/src/mcp/mcpClient.ts`:

```typescript
import { MCPClient } from "@mastra/mcp";

// Cliente MCP para conectar a servidores externos
export const mcpClient = new MCPClient({
  id: "tesis-hub-mcp-client",
  servers: {
    // Ejemplo: Wikipedia MCP Server
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
```

### Paso 2: Crear un Agente con Herramientas MCP

Crea el archivo `backend/src/agents/asistenteTesis.ts`:

```typescript
import { Agent } from "@mastra/core/agent";
import { gemini } from "@mastra/gemini";
import { mcpClient } from "../mcp/mcpClient";

// Crear agente con herramientas MCP
export const asistenteTesis = new Agent({
  name: "Asistente de Tesis",
  description: "Asistente académico con acceso a herramientas MCP",
  instructions: `
    Eres un asistente académico especializado en ayudar con tesis y proyectos de investigación.
    
    Tienes acceso a:
    - Wikipedia MCP Server: Para buscar información académica y referencias
    - Herramientas propias del sistema: Para acceder a proyectos y tesis
    
    Siempre cita tus fuentes y proporciona información precisa.
  `,
  model: gemini("gemini-1.5-flash", {
    apiKey: process.env.GEMINI_API_KEY!,
  }),
  // Obtener herramientas de los servidores MCP
  tools: await mcpClient.getTools(),
});
```

### Paso 3: Usar el Agente en tu ChatService

Modifica `backend/src/services/chatService.ts`:

```typescript
import { asistenteTesis } from '../agents/asistenteTesis';

export class ChatService {
  static async generarRespuesta(
    mensaje: string,
    contexto: ContextoChat
  ): Promise<{ respuesta: string; referencias?: Array<{ titulo: string; autor: string; año: number }> }> {
    
    // Usar el agente con MCP en lugar de Gemini directamente
    const respuesta = await asistenteTesis.generate({
      messages: [
        {
          role: 'user',
          content: mensaje
        }
      ],
      context: {
        usuario: contexto.usuario,
        proyectoId: contexto.proyectoId
      }
    });

    return {
      respuesta: respuesta.text,
      referencias: [] // El agente puede extraer referencias automáticamente
    };
  }
}
```

---

## 📝 Ejemplo 2: Crear Herramientas Propias y Exponerlas como MCP

### Paso 1: Crear Herramientas

Crea `backend/src/tools/proyectoTools.ts`:

```typescript
import { tool } from "@mastra/core";
import { ProyectoModel } from "../models/Proyecto";

// Herramienta para obtener información de un proyecto
export const obtenerProyectoTool = tool({
  id: "obtener-proyecto",
  description: "Obtiene información detallada de un proyecto por su ID",
  parameters: {
    type: "object",
    properties: {
      proyectoId: {
        type: "number",
        description: "ID del proyecto a obtener"
      }
    },
    required: ["proyectoId"]
  },
  execute: async ({ proyectoId }: { proyectoId: number }) => {
    const proyecto = await ProyectoModel.obtenerPorId(proyectoId);
    if (!proyecto) {
      return { error: "Proyecto no encontrado" };
    }
    return {
      titulo: proyecto.titulo,
      descripcion: proyecto.descripcion,
      estado: proyecto.estado,
      metodologia: proyecto.metodologia
    };
  }
});

// Herramienta para buscar tesis similares
export const buscarTesisSimilaresTool = tool({
  id: "buscar-tesis-similares",
  description: "Busca tesis similares basándose en palabras clave",
  parameters: {
    type: "object",
    properties: {
      consulta: {
        type: "string",
        description: "Palabras clave para buscar tesis similares"
      }
    },
    required: ["consulta"]
  },
  execute: async ({ consulta }: { consulta: string }) => {
    // Implementar búsqueda de tesis
    // Por ahora retornamos un ejemplo
    return {
      tesis: [
        { titulo: "Ejemplo 1", autor: "Autor 1" },
        { titulo: "Ejemplo 2", autor: "Autor 2" }
      ]
    };
  }
});
```

### Paso 2: Crear un MCPServer

Crea `backend/src/mcp/mcpServer.ts`:

```typescript
import { MCPServer } from "@mastra/mcp";
import { asistenteTesis } from "../agents/asistenteTesis";
import { obtenerProyectoTool, buscarTesisSimilaresTool } from "../tools/proyectoTools";

// Servidor MCP que expone tus herramientas y agentes
export const mcpServer = new MCPServer({
  id: "tesis-hub-mcp-server",
  name: "TesisHub MCP Server",
  version: "1.0.0",
  agents: { 
    asistenteTesis 
  },
  tools: { 
    obtenerProyecto: obtenerProyectoTool,
    buscarTesisSimilares: buscarTesisSimilaresTool
  },
});
```

### Paso 3: Registrar el MCPServer en Mastra

Crea o modifica `backend/src/mastra/index.ts`:

```typescript
import { Mastra } from "@mastra/core/mastra";
import { mcpServer } from "./mcp/mcpServer";

export const mastra = new Mastra({
  name: "TesisHub",
  mcpServers: { 
    mcpServer 
  },
});
```

---

## 📝 Ejemplo 3: Usar MCPClient con Herramientas Dinámicas

Si necesitas diferentes configuraciones por usuario (multi-tenant):

```typescript
import { MCPClient } from "@mastra/mcp";

async function generarRespuestaConMCP(
  mensaje: string, 
  usuarioId: number,
  apiKeyPersonal?: string
) {
  // Crear cliente MCP dinámico por usuario
  const userMcp = new MCPClient({
    id: `user-${usuarioId}-mcp`,
    servers: {
      // Servidor con API key personal del usuario
      personalService: {
        url: new URL("https://api.ejemplo.com/mcp"),
        requestInit: {
          headers: {
            Authorization: `Bearer ${apiKeyPersonal}`,
          },
        },
      },
    },
  });

  // Obtener herramientas dinámicamente
  const toolsets = await userMcp.getToolsets();

  // Usar con el agente
  const agent = mastra.getAgent("asistenteTesis");
  const respuesta = await agent.generate(mensaje, {
    toolsets: toolsets, // Pasar herramientas dinámicas
  });

  // Limpiar conexión
  await userMcp.disconnect();

  return respuesta;
}
```

---

## 🔧 Configuración de Variables de Entorno

Asegúrate de tener en `backend/.env`:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

---

## 📚 Servidores MCP Disponibles

Puedes conectar a varios servidores MCP populares:

### Wikipedia MCP
```typescript
wikipedia: {
  command: "npx",
  args: ["-y", "wikipedia-mcp"],
}
```

### Weather Service
```typescript
weather: {
  url: new URL("https://server.smithery.ai/@smithery-ai/national-weather-service/mcp?api_key=TU_API_KEY"),
}
```

### Otros servidores
- **Klavis AI**: Servidores enterprise (Salesforce, HubSpot)
- **mcp.run**: Servidores pre-autenticados
- **Composio.dev**: Integraciones con Google Sheets, Gmail, etc.
- **Smithery.ai**: Registro de servidores MCP

---

## 🎯 Casos de Uso para TesisHub

### 1. **Búsqueda de Referencias Académicas**
Conecta a Wikipedia MCP para buscar información académica y referencias.

### 2. **Análisis de Proyectos**
Crea herramientas propias que analicen proyectos y los comparen con tesis similares.

### 3. **Generación de Comentarios**
El agente puede usar herramientas para generar comentarios constructivos automáticamente.

### 4. **Búsqueda Inteligente**
Usa RAG (Retrieval Augmented Generation) con MCP para búsquedas semánticas en tu base de datos.

---

## ⚠️ Notas Importantes

1. **Herramientas Estáticas vs Dinámicas**:
   - `.getTools()`: Para configuración estática (una vez al inicializar)
   - `.getToolsets()`: Para configuración dinámica (por request/usuario)

2. **Desconexión**:
   - Siempre llama `await mcpClient.disconnect()` cuando termines de usar un cliente dinámico

3. **Manejo de Errores**:
   - Los servidores MCP pueden fallar, siempre maneja errores apropiadamente

4. **Performance**:
   - Las herramientas MCP agregan latencia, úsalas solo cuando sea necesario

---

## 🚀 Próximos Pasos

1. ✅ Instalar `@mastra/mcp` (ya hecho)
2. ⬜ Crear `MCPClient` básico
3. ⬜ Crear herramientas propias
4. ⬜ Integrar con tu `ChatService` existente
5. ⬜ Probar con servidores MCP externos

---

¿Necesitas ayuda implementando alguno de estos ejemplos? 🎓

