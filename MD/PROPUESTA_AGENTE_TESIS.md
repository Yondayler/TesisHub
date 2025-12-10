# 🎓 Propuesta: Agente Especializado en Tesis con Base de Datos y Referencias

## 📋 Resumen del Proyecto

Crear un **agente de IA especializado en tesis** que:
1. ✅ Ayuda a estudiantes y tutores universitarios
2. ✅ Tiene acceso a una **gran base de datos de tesis**
3. ✅ **Cita referencias específicas** de tesis cuando responde preguntas
4. ✅ Es experto en metodología, estructura y evaluación de tesis

---

## ✅ ¿Por qué Mastra es PERFECTO para este caso?

### 1. **RAG (Retrieval Augmented Generation) - CARACTERÍSTICA CLAVE**

Mastra tiene **RAG integrado** que permite:
- 🔍 **Búsqueda semántica**: Buscar tesis por significado, no solo palabras clave
- 📚 **Recuperación de contexto**: Encontrar tesis relevantes antes de responder
- 📝 **Citas automáticas**: El agente puede citar las tesis que usa como referencia

**Ejemplo de flujo:**
```
Usuario: "¿Cómo estructurar un marco teórico para una tesis en ingeniería?"
↓
Agente (Mastra):
  1. Busca en BD de tesis (usando embeddings)
  2. Encuentra 3 tesis relevantes en ingeniería
  3. Extrae ejemplos de marcos teóricos
  4. Genera respuesta CITANDO las tesis:
     "Según la tesis 'Sistema de Gestión...' (2023) y 
      'Análisis de Redes...' (2024), el marco teórico debe..."
```

### 2. **Agentes Especializados**

Puedes crear **dos agentes diferentes**:
- **Agente para Estudiantes**: Enfoque educativo y guía
- **Agente para Tutores**: Enfoque en evaluación y criterios

### 3. **Memoria Persistente**

El agente recuerda:
- Consultas anteriores del usuario
- Proyectos que está revisando
- Preferencias del usuario

### 4. **TypeScript Nativo**

Perfecto para tu stack (Express + TypeScript)

---

## 🏗️ Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│              Componente de Chat del Agente               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express + Mastra)                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Agente Especializado en Tesis            │  │
│  │  (creado con Mastra)                             │  │
│  └───────────────┬──────────────────────────────────┘  │
│                  │                                       │
│       ┌──────────┴──────────┐                          │
│       │                     │                           │
│       ▼                     ▼                           │
│  ┌─────────┐         ┌──────────────┐                 │
│  │ Gemini  │         │   RAG Engine │                 │
│  │  API    │         │   (Mastra)   │                 │
│  └─────────┘         └──────┬───────┘                 │
│                              │                          │
│                              ▼                          │
│                    ┌──────────────────┐                │
│                    │  Base de Datos   │                │
│                    │  ┌────────────┐  │                │
│                    │  │   tesis    │  │                │
│                    │  │  (SQLite)  │  │                │
│                    │  └────────────┘  │                │
│                    │  ┌────────────┐  │                │
│                    │  │ embeddings │  │                │
│                    │  │ (vectores) │  │                │
│                    │  └────────────┘  │                │
│                    └──────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Estructura de Base de Datos para Tesis

### Nueva Tabla: `tesis_referencias`

```sql
CREATE TABLE IF NOT EXISTS tesis_referencias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  año INTEGER NOT NULL,
  universidad TEXT,
  carrera TEXT, -- ej: "Ingeniería en Sistemas", "Psicología"
  area_conocimiento TEXT, -- ej: "Tecnología", "Ciencias Sociales"
  resumen TEXT NOT NULL,
  metodologia TEXT,
  palabras_clave TEXT, -- JSON array
  contenido_completo TEXT, -- Texto completo de la tesis
  archivo_pdf TEXT, -- Ruta al PDF si está disponible
  estado TEXT DEFAULT 'disponible', -- disponible, restringido
  fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Campos para RAG/Embeddings
  embedding BLOB, -- Vector embedding de la tesis (opcional)
  chunk_text TEXT, -- Fragmentos de texto para búsqueda
  metadata JSON -- Información adicional
);
```

### Tabla para Embeddings (si usas búsqueda vectorial):

```sql
CREATE TABLE IF NOT EXISTS tesis_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tesis_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL, -- Índice del fragmento
  chunk_text TEXT NOT NULL, -- Fragmento de texto
  embedding BLOB NOT NULL, -- Vector embedding
  metadata TEXT, -- JSON con metadata del chunk
  FOREIGN KEY (tesis_id) REFERENCES tesis_referencias(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_tesis ON tesis_embeddings(tesis_id);
```

### Índices para Búsqueda:

```sql
CREATE INDEX idx_tesis_carrera ON tesis_referencias(carrera);
CREATE INDEX idx_tesis_area ON tesis_referencias(area_conocimiento);
CREATE INDEX idx_tesis_año ON tesis_referencias(año);
CREATE INDEX idx_tesis_palabras_clave ON tesis_referencias(palabras_clave);
```

---

## 🤖 Implementación del Agente con Mastra

### 1. Configuración del Agente Especializado

```typescript
// backend/src/agents/agenteTesis.ts
import { createAgent } from '@mastra/core'
import { geminiModel } from '@mastra/gemini'
import { createRAG } from '@mastra/rag'
import { buscarTesisTool, obtenerTesisCompletaTool } from './tools/tesisTools'

// Crear RAG para búsqueda en base de datos de tesis
const ragEngine = createRAG({
  vectorStore: {
    type: 'sqlite',
    path: './database/tesis_embeddings.db'
  },
  embeddingModel: 'gemini', // O usar otro modelo para embeddings
  retrievalConfig: {
    topK: 5, // Top 5 tesis más relevantes
    similarityThreshold: 0.7
  }
})

// Agente para Estudiantes
export const agenteEstudiante = createAgent({
  name: 'Asistente de Tesis para Estudiantes',
  model: geminiModel({
    modelId: 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY!
  }),
  
  instructions: `
    Eres un asistente académico especializado en ayudar a estudiantes universitarios 
    a crear, estructurar y mejorar sus tesis y proyectos de investigación.
    
    TU ESPECIALIDAD:
    - Estructura académica de tesis
    - Metodología de investigación
    - Redacción académica
    - Citas y referencias
    - Aspectos formales de tesis
    
    CÓMO TRABAJAS:
    1. Cuando un estudiante hace una pregunta, PRIMERO busca en la base de datos 
       de tesis para encontrar ejemplos y referencias relevantes.
    2. Siempre CITA las tesis que uses como referencia (título, autor, año).
    3. Proporciona ejemplos concretos basados en tesis reales.
    4. Sé educativo, claro y constructivo.
    5. Adapta tu lenguaje al nivel del estudiante.
    
    FORMATO DE CITAS:
    Cuando cites una tesis, usa este formato:
    "Según la tesis '[Título]' de [Autor] ([Año]), [explicación]"
    
    SIEMPRE incluye al menos 2-3 referencias de tesis cuando sea posible.
  `,
  
  tools: [
    buscarTesisTool,      // Busca tesis relevantes
    obtenerTesisCompletaTool, // Obtiene contenido completo
    ragEngine.retrieveTool()  // Herramienta RAG para búsqueda semántica
  ],
  
  memory: {
    type: 'persistent',
    storage: 'database',
    contextFields: ['usuarioId', 'proyectoId', 'carrera']
  }
})

// Agente para Tutores
export const agenteTutor = createAgent({
  name: 'Asistente de Tesis para Tutores',
  model: geminiModel({
    modelId: 'gemini-1.5-pro',
    apiKey: process.env.GEMINI_API_KEY!
  }),
  
  instructions: `
    Eres un asistente especializado en ayudar a tutores académicos a revisar 
    y evaluar tesis y proyectos de investigación.
    
    TU ESPECIALIDAD:
    - Criterios de evaluación de tesis
    - Identificación de fortalezas y debilidades
    - Generación de comentarios constructivos
    - Comparación con tesis similares
    - Sugerencias de mejoras específicas
    
    CÓMO TRABAJAS:
    1. Analiza proyectos comparándolos con tesis similares de la base de datos.
    2. Identifica áreas que necesitan mejora basándote en estándares académicos.
    3. Genera comentarios constructivos y específicos.
    4. Sugiere referencias de tesis que el estudiante debería revisar.
    5. Proporciona ejemplos concretos de cómo mejorar.
    
    SIEMPRE referencia tesis similares cuando hagas recomendaciones.
  `,
  
  tools: [
    buscarTesisTool,
    obtenerTesisCompletaTool,
    ragEngine.retrieveTool(),
    compararConTesisTool
  ],
  
  memory: {
    type: 'persistent',
    storage: 'database'
  }
})
```

### 2. Herramientas (Tools) del Agente

```typescript
// backend/src/agents/tools/tesisTools.ts
import { ProyectoService } from '../../services/proyectoService'
import { TesisModel } from '../../models/TesisModel'

export const buscarTesisTool = {
  name: 'buscar_tesis',
  description: 'Busca tesis relevantes en la base de datos por título, área, carrera o palabras clave. Retorna tesis que puedan ser útiles como referencia.',
  
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Consulta de búsqueda (palabras clave, tema, área)'
      },
      carrera: {
        type: 'string',
        description: 'Carrera o área de conocimiento (opcional)'
      },
      limit: {
        type: 'number',
        description: 'Número máximo de resultados',
        default: 5
      }
    },
    required: ['query']
  },
  
  execute: async ({ query, carrera, limit = 5 }: any) => {
    // Buscar tesis en la base de datos
    const tesis = await TesisModel.buscar(query, carrera, limit)
    
    return {
      tesis_encontradas: tesis.length,
      tesis: tesis.map(t => ({
        id: t.id,
        titulo: t.titulo,
        autor: t.autor,
        año: t.año,
        carrera: t.carrera,
        resumen: t.resumen.substring(0, 200) + '...',
        relevancia: t.relevancia // Score de relevancia
      }))
    }
  }
}

export const obtenerTesisCompletaTool = {
  name: 'obtener_tesis_completa',
  description: 'Obtiene el contenido completo de una tesis específica por su ID. Úsalo cuando necesites detalles específicos de una tesis.',
  
  parameters: {
    type: 'object',
    properties: {
      tesis_id: {
        type: 'number',
        description: 'ID de la tesis a obtener'
      }
    },
    required: ['tesis_id']
  },
  
  execute: async ({ tesis_id }: any) => {
    const tesis = await TesisModel.obtenerPorId(tesis_id)
    
    if (!tesis) {
      return { error: 'Tesis no encontrada' }
    }
    
    return {
      titulo: tesis.titulo,
      autor: tesis.autor,
      año: tesis.año,
      universidad: tesis.universidad,
      carrera: tesis.carrera,
      resumen: tesis.resumen,
      metodologia: tesis.metodologia,
      palabras_clave: tesis.palabras_clave,
      contenido: tesis.contenido_completo?.substring(0, 5000) // Primeros 5000 caracteres
    }
  }
}

export const compararConTesisTool = {
  name: 'comparar_con_tesis_similares',
  description: 'Compara un proyecto con tesis similares en la base de datos. Útil para tutores que quieren ver cómo se ha abordado un tema similar.',
  
  parameters: {
    type: 'object',
    properties: {
      proyecto_id: {
        type: 'number',
        description: 'ID del proyecto a comparar'
      },
      top_k: {
        type: 'number',
        description: 'Número de tesis similares a encontrar',
        default: 3
      }
    },
    required: ['proyecto_id']
  },
  
  execute: async ({ proyecto_id, top_k = 3 }: any) => {
    // Obtener proyecto
    const proyecto = await ProyectoService.obtenerPorId(proyecto_id)
    
    if (!proyecto) {
      return { error: 'Proyecto no encontrado' }
    }
    
    // Buscar tesis similares usando RAG
    const tesisSimilares = await TesisModel.buscarSimilares(
      proyecto.titulo + ' ' + proyecto.descripcion,
      top_k
    )
    
    return {
      proyecto: {
        id: proyecto.id,
        titulo: proyecto.titulo,
        area: proyecto.area_conocimiento
      },
      tesis_similares: tesisSimilares.map(t => ({
        id: t.id,
        titulo: t.titulo,
        autor: t.autor,
        año: t.año,
        similitud: t.similitud,
        puntos_comunes: t.puntos_comunes
      }))
    }
  }
}
```

### 3. Integración con RAG (Búsqueda Semántica)

```typescript
// backend/src/services/ragTesisService.ts
import { createRAG } from '@mastra/rag'
import { geminiEmbeddings } from '@mastra/gemini'
import { TesisModel } from '../models/TesisModel'

class RAGTesisService {
  private rag: any
  
  constructor() {
    this.rag = createRAG({
      embeddings: geminiEmbeddings({
        apiKey: process.env.GEMINI_API_KEY!
      }),
      vectorStore: {
        type: 'sqlite',
        path: process.env.DB_PATH || './database/database.db'
      },
      chunking: {
        chunkSize: 1000, // 1000 caracteres por chunk
        chunkOverlap: 200
      }
    })
  }
  
  // Indexar una nueva tesis en el sistema RAG
  async indexarTesis(tesisId: number) {
    const tesis = await TesisModel.obtenerPorId(tesisId)
    
    if (!tesis) {
      throw new Error('Tesis no encontrada')
    }
    
    // Texto completo a indexar
    const texto = `
      Título: ${tesis.titulo}
      Autor: ${tesis.autor}
      Año: ${tesis.año}
      Carrera: ${tesis.carrera}
      Resumen: ${tesis.resumen}
      Metodología: ${tesis.metodologia}
      Contenido: ${tesis.contenido_completo}
    `
    
    // Indexar en el vector store
    await this.rag.index({
      id: `tesis_${tesisId}`,
      content: texto,
      metadata: {
        tesis_id: tesisId,
        titulo: tesis.titulo,
        autor: tesis.autor,
        año: tesis.año,
        carrera: tesis.carrera
      }
    })
  }
  
  // Buscar tesis relevantes usando búsqueda semántica
  async buscarTesisRelevantes(consulta: string, limit: number = 5) {
    // Buscar usando embeddings
    const resultados = await this.rag.retrieve({
      query: consulta,
      topK: limit
    })
    
    // Formatear resultados con información de tesis
    const tesisIds = resultados.map((r: any) => r.metadata.tesis_id)
    const tesis = await TesisModel.obtenerPorIds(tesisIds)
    
    return tesis.map((t: any, index: number) => ({
      ...t,
      relevancia: resultados[index].score,
      chunk_relevante: resultados[index].content
    }))
  }
}

export const ragTesisService = new RAGTesisService()
```

---

## 💬 Ejemplos de Uso

### Ejemplo 1: Estudiante pregunta sobre estructura

**Usuario (Estudiante):**
```
"¿Cómo debo estructurar el capítulo de metodología de mi tesis 
en ingeniería de sistemas?"
```

**Agente (usando RAG):**
```
He encontrado 3 tesis relevantes en ingeniería de sistemas que 
pueden servirte como referencia:

1. "Sistema de Gestión de Proyectos Ágiles" (2023) - Juan Pérez
2. "Desarrollo de Aplicación Web para E-commerce" (2024) - María García
3. "Análisis de Redes Sociales con Machine Learning" (2023) - Carlos López

Según estas tesis, la estructura del capítulo de metodología debe incluir:

1. **Tipo de Investigación**: 
   Según "Sistema de Gestión..." (2023), define si es exploratoria, 
   descriptiva o experimental.

2. **Población y Muestra**:
   Como en "Desarrollo de Aplicación Web..." (2024), especifica 
   tu población objetivo y criterios de selección.

3. **Técnicas e Instrumentos**:
   Siguiendo el ejemplo de "Análisis de Redes..." (2023), detalla 
   las herramientas y técnicas de recolección de datos.

¿Te gustaría que profundice en alguno de estos puntos o que 
busque más ejemplos específicos?
```

### Ejemplo 2: Tutor compara proyecto

**Usuario (Tutor):**
```
"Revisa el proyecto ID 42 y compáralo con tesis similares"
```

**Agente (usando herramientas):**
```
He analizado el proyecto "Sistema de Gestión Académica" y lo 
he comparado con 3 tesis similares:

**TESIS SIMILARES ENCONTRADAS:**
1. "Plataforma de Gestión Universitaria" (2023) - Similitud: 85%
2. "Sistema de Matrícula Online" (2024) - Similitud: 78%
3. "Aplicación Web para Gestión Estudiantil" (2023) - Similitud: 72%

**PUNTOS FUERTES del proyecto:**
✅ Buena estructura metodológica (similar a "Plataforma de Gestión...")
✅ Objetivos claros y alcanzables
✅ Tecnologías modernas bien seleccionadas

**ÁREAS DE MEJORA (comparado con tesis similares):**
⚠️ Falta detalle en el análisis de requisitos (ver "Sistema de Matrícula...")
⚠️ La justificación podría ser más robusta (como en "Aplicación Web...")
⚠️ Considera agregar un capítulo de costos (presente en todas las tesis similares)

**RECOMENDACIONES:**
1. Revisa la sección 3.2 de "Plataforma de Gestión..." para 
   mejorar tu análisis de requisitos.

2. Incluye un análisis comparativo con sistemas similares, 
   como lo hace "Sistema de Matrícula..." en su capítulo 2.

¿Te ayudo a generar comentarios específicos para el estudiante?
```

---

## 🚀 Plan de Implementación

### Fase 1: Base de Datos de Tesis (Semana 1)
- [ ] Crear tabla `tesis_referencias`
- [ ] Crear tabla `tesis_embeddings` (para RAG)
- [ ] Script para migración/creación
- [ ] Modelo `TesisModel` en backend
- [ ] Endpoints CRUD básicos para tesis

### Fase 2: Integración con Mastra (Semana 1-2)
- [ ] Instalar Mastra: `npm install @mastra/core @mastra/gemini @mastra/rag`
- [ ] Configurar Gemini API
- [ ] Crear agente básico para estudiantes
- [ ] Crear agente básico para tutores
- [ ] Configurar RAG con base de datos

### Fase 3: Herramientas (Tools) (Semana 2)
- [ ] Tool: `buscarTesis`
- [ ] Tool: `obtenerTesisCompleta`
- [ ] Tool: `compararConTesisSimilares`
- [ ] Integrar RAG para búsqueda semántica

### Fase 4: Indexación de Tesis (Semana 2-3)
- [ ] Script para indexar tesis existentes
- [ ] Generar embeddings de tesis
- [ ] Sistema para indexar nuevas tesis automáticamente
- [ ] Endpoint para subir/importar tesis

### Fase 5: Frontend - Chat (Semana 3)
- [ ] Componente de chat del agente
- [ ] Integración con backend
- [ ] Mostrar citas y referencias
- [ ] UI para buscar tesis

### Fase 6: Mejoras y Optimización (Semana 4)
- [ ] Mejorar prompts del agente
- [ ] Optimizar búsqueda RAG
- [ ] Cache de respuestas frecuentes
- [ ] Analytics de uso

---

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "@mastra/core": "^latest",
    "@mastra/gemini": "^latest",
    "@mastra/rag": "^latest",
    "@google/generative-ai": "^0.2.0"
  }
}
```

---

## 🎯 Ventajas Clave de Esta Solución

### ✅ RAG Integrado
- Búsqueda semántica (por significado, no palabras)
- Citas automáticas de tesis
- Contexto relevante siempre

### ✅ Agentes Especializados
- Diferentes personalidades para estudiantes/tutores
- Memoria persistente
- Decisiones autónomas sobre qué tesis buscar

### ✅ Escalable
- Fácil agregar más tesis
- Optimización automática
- Multi-modelo (si necesitas cambiar de Gemini)

### ✅ TypeScript Nativo
- Compatible con tu stack actual
- Type-safe
- Fácil de mantener

---

## 📊 Métricas de Éxito

1. **Relevancia de Respuestas**: % de respuestas que citan tesis relevantes
2. **Precisión de Búsqueda**: Score de similitud de tesis encontradas
3. **Satisfacción**: Feedback de estudiantes y tutores
4. **Uso**: Número de consultas por día
5. **Referencias Útiles**: % de usuarios que siguen las referencias citadas

---

## 🔄 Consideraciones Importantes

### 1. **Límite de Gemini (250 req/día)**
- **Indexación**: Hacer en batch (no en tiempo real)
- **Búsqueda RAG**: Cachear resultados similares
- **Respuestas**: Cachear preguntas frecuentes

### 2. **Datos de Tesis**
- ¿De dónde vendrán las tesis?
- ¿Necesitas permiso/autorización?
- ¿PDFs o solo texto estructurado?

### 3. **Privacidad**
- No indexar proyectos activos (solo aprobados)
- Respeta derechos de autor de tesis
- Anonimizar datos si es necesario

---

## ✅ Conclusión

**MASTRA es la MEJOR opción** para este caso porque:

1. ✅ **RAG integrado** - Esencial para buscar en base de datos de tesis
2. ✅ **Agentes especializados** - Diferentes para estudiantes/tutores
3. ✅ **Citas automáticas** - El agente puede referenciar tesis específicas
4. ✅ **Búsqueda semántica** - Encuentra tesis relevantes por significado
5. ✅ **TypeScript nativo** - Compatible con tu stack
6. ✅ **Escalable** - Fácil agregar más funcionalidades

**No hay mejor alternativa** para un agente con base de datos de referencias.

---

**¿Quieres que empecemos con la implementación?** 🚀

Podemos comenzar con:
1. Crear estructura de base de datos para tesis
2. Instalar y configurar Mastra
3. Crear el primer agente básico
4. Implementar búsqueda RAG

