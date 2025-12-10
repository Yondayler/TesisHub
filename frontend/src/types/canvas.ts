/**
 * Tipos e interfaces para el sistema Canvas de generación de tesis
 */

export interface DatosPortada {
    universidad: string;
    facultad: string;
    carrera: string;
    titulo: string;
    autor: string;
    tutor?: string;
    ciudad: string;
    fecha: string;
}

export interface Subseccion {
    titulo: string;
    contenido: string;
}

export interface Capitulo {
    numero: number;
    titulo: string;
    subsecciones: Subseccion[];
    referencias?: string[];
}

export interface DocumentoTesis {
    portada: Portada;
    capitulos: Capitulo[];
}

/**
 * Nuevo tipo para exportación con HTML (mantiene formato visual)
 */
export interface DocumentoTesisHTML {
    portada: Portada;
    indiceHTML: string;
    seccionesHTML: Array<{
        titulo: string;
        contenidoHTML: string;
    }>;
    nivel: 'grado_1' | 'grado_2';
}

// ============================================
// NUEVOS TIPOS: Estructura Académica Completa
// ============================================

export type SeccionAcademica =
    | 'portada'
    | 'indice'
    | 'resumen'
    | 'introduccion' // Opcional, dependiendo de si Diagnóstico reemplaza a Introducción o no
    | 'diagnostico'
    | 'herramientas'
    | 'desarrollo'
    | 'pruebas'
    | 'conclusiones'
    | 'recomendaciones'
    | 'referencias'
    | 'marco_teorico' // Mantener por compatibilidad o si se usa en otros tipos
    | 'metodologia'   // Mantener por compatibilidad
    | 'resultados';   // Mantener por compatibilidad

export interface Portada {
    universidad: string;
    facultad: string;
    carrera: string;
    titulo: string;
    autor: string;
    email?: string;
    tutor?: string;
    ciudad: string;
    fecha: string;
    descripcion?: string; // Agregado para regeneración
    tipo?: string;        // Agregado para regeneración
    nivel?: 'grado_1' | 'grado_2'; // Agregado para selección de estructura
}

export interface Indice {
    secciones: ItemIndice[];
}

export interface ItemIndice {
    titulo: string;
    pagina: number;
    nivel: number; // 1 = capítulo, 2 = sección, 3 = subsección
    subsecciones?: ItemIndice[];
}

export interface Resumen {
    contenido: string;
    palabrasClave: string[];
}

export interface Introduccion {
    planteamientoProblema: string;
    justificacion: string;
    objetivoGeneral: string;
    objetivosEspecificos: string[];
    alcance: string;
    limitaciones: string;
}

export interface MarcoTeorico {
    antecedentes: string;
    basesTeoricas: string;
    definicionTerminos: string;
}

export interface Metodologia {
    tipoInvestigacion: string;
    disenoInvestigacion: string;
    poblacionMuestra: string;
    tecnicasRecoleccion: string;
    instrumentos: string;
    procedimiento: string;
}

export interface Resultados {
    analisisDatos: string;
    presentacionResultados: string;
    interpretacion: string;
}

export interface Conclusiones {
    conclusiones: string[];
    cumplimientoObjetivos: string;
}

export interface Recomendaciones {
    recomendaciones: string[];
    trabajosFuturos: string;
}

export interface Referencias {
    referencias: Referencia[];
}

export interface Referencia {
    tipo: 'libro' | 'articulo' | 'web' | 'tesis' | 'otro';
    autores: string[];
    titulo: string;
    año: number;
    editorial?: string;
    url?: string;
    doi?: string;
}

export interface DocumentoTesisCompleto {
    portada: Portada;
    indice: Indice;
    resumen: Resumen;
    introduccion: Introduccion;
    marcoTeorico: MarcoTeorico;
    metodologia: Metodologia;
    resultados: Resultados;
    conclusiones: Conclusiones;
    recomendaciones: Recomendaciones;
    referencias: Referencias;
    // Capítulos adicionales personalizados
    capitulosAdicionales?: Capitulo[];
}

export interface EstadoSeccion {
    seccion: SeccionAcademica;
    completada: boolean;
    generando: boolean;
    paginas: number;
    error?: boolean; // Indica si hubo un error al generar esta sección
    mensajeError?: string; // Mensaje de error opcional
}

export interface ContextoTesis {
    titulo: string;
    descripcion: string;
    carrera: string;
    tipo: 'desarrollo_software' | 'investigacion_campo' | 'estudio_caso' | 'revision_literatura';
    nivel?: 'grado_1' | 'grado_2'; // grado_1 = Estándar, grado_2 = Tecnológico
}

export interface IndiceGenerado {
    titulo_tesis: string;
    capitulos: {
        numero: number;
        titulo: string;
        subsecciones: string[];
    }[];
}

export interface DatosGeneracionIndice {
    titulo: string;
    descripcion: string;
    carrera: string;
    tipo: 'desarrollo_software' | 'investigacion_campo' | 'estudio_caso' | 'revision_literatura';
    modelo?: 'rapido' | 'razonamiento' | 'canvas';
}

export interface DatosGeneracionCapitulo {
    numeroCapitulo: number;
    tituloCapitulo: string;
    subsecciones: string[];
    contextoTesis: ContextoTesis;
    capitulosAnteriores?: Capitulo[];
    modelo?: 'rapido' | 'razonamiento' | 'canvas';
}

export type EstadoGeneracion = 'idle' | 'generando_indice' | 'generando_capitulo' | 'exportando' | 'completado' | 'error';
