# Análisis de Herramientas del Agente de Tesis

## Herramientas Actuales

### 1. buscarTesis
- **Función**: Busca tesis por palabras clave y opcionalmente por carrera
- **Retorna**: Lista de tesis con título, autor, año, resumen, carrera
- **Límite**: 5 resultados

### 2. leerTesis
- **Función**: Lee el contenido completo de una tesis específica por ID
- **Retorna**: Contenido completo, metodología, resumen, estructura

### 3. consultarReglamento
- **Función**: Consulta el reglamento oficial de tesis
- **Retorna**: Información sobre normas APA, márgenes, estructura, requisitos

## Herramientas Adicionales Sugeridas

### ✅ RECOMENDADAS

#### 1. `listarCarreras`
**Propósito**: Obtener lista de carreras disponibles en la BD

**Por qué es útil**:
- El agente podría no saber qué carreras existen en la BD
- Ayuda a hacer búsquedas más precisas cuando el usuario menciona su carrera
- Permite sugerir carreras afines si no hay resultados

**Implementación**:
```typescript
export const listarCarrerasTool = createTool({
  id: "listarCarreras",
  inputSchema: z.object({}),
  description: "Lista todas las carreras disponibles en la base de datos de tesis",
  execute: async () => {
    const stats = await TesisReferenciaModel.obtenerEstadisticas();
    return stats.por_carrera.map(c => c.carrera);
  }
});
```

#### 2. `buscarPorCarrera`
**Propósito**: Buscar tesis específicamente por carrera (sin query de texto)

**Por qué es útil**:
- Cuando el agente quiere ver TODAS las tesis de una carrera
- Más directo que `buscarTesis` con query vacía
- Útil para la estrategia de búsqueda flexible (paso 2: buscar por carrera)

**Implementación**:
```typescript
export const buscarPorCarreraTool = createTool({
  id: "buscarPorCarrera",
  inputSchema: z.object({
    carrera: z.string().describe("Nombre de la carrera"),
    limit: z.number().optional().default(10)
  }),
  description: "Busca todas las tesis de una carrera específica",
  execute: async ({ context: { carrera, limit } }) => {
    return await TesisReferenciaModel.buscarPorCarrera(carrera, limit);
  }
});
```

#### 3. `obtenerEstadisticas`
**Propósito**: Ver qué hay disponible en la BD (carreras, áreas, total)

**Por qué es útil**:
- El agente puede saber qué carreras/áreas tienen más tesis
- Útil cuando el usuario pregunta "¿qué tesis tienes?"
- Ayuda al agente a decidir estrategias de búsqueda

**Implementación**:
```typescript
export const obtenerEstadisticasTool = createTool({
  id: "obtenerEstadisticas",
  inputSchema: z.object({}),
  description: "Obtiene estadísticas de la base de datos: total de tesis, carreras disponibles, áreas de conocimiento",
  execute: async () => {
    return await TesisReferenciaModel.obtenerEstadisticas();
  }
});
```

### ⚠️ OPCIONALES (Evaluar según necesidad)

#### 4. `buscarPorArea`
**Propósito**: Buscar por área de conocimiento

**Cuándo es útil**: Si tienes áreas bien definidas y quieres búsquedas más amplias que carrera

#### 5. `obtenerTesisRecientes`
**Propósito**: Obtener las N tesis más recientes

**Cuándo es útil**: Para mostrar ejemplos actuales o cuando no hay query específica

## Recomendación Final

### IMPLEMENTAR AHORA:
1. ✅ `listarCarreras` - Crítica para búsqueda flexible
2. ✅ `buscarPorCarrera` - Mejora significativa en búsqueda
3. ✅ `obtenerEstadisticas` - Útil para orientar al usuario

### EVALUAR DESPUÉS:
- `buscarPorArea` - Solo si las áreas están bien categorizadas
- `obtenerTesisRecientes` - Baja prioridad

## Impacto en el Comportamiento del Agente

Con estas 3 herramientas adicionales:

**Antes**:
- Agente busca con query → No encuentra → Se traba o inventa

**Después**:
- Agente busca con query → No encuentra
- Agente lista carreras disponibles → Encuentra carrera similar
- Agente busca por esa carrera → Encuentra tesis
- Agente usa patrones de esas tesis → Construye respuesta

**Ejemplo de flujo mejorado**:
```
Usuario: "Ayúdame con mi tesis sobre blockchain"
1. buscarTesis("blockchain") → 0 resultados
2. listarCarreras() → ["Ingeniería en Informática", "Ingeniería de Sistemas", ...]
3. buscarPorCarrera("Ingeniería en Informática") → 5 tesis
4. leerTesis(tesis[0]) → Extrae patrones
5. Responde: "Aunque no encontré tesis sobre blockchain, revisé tesis de Ingeniería en Informática como '[Título]' que desarrolló un sistema web..."
```
