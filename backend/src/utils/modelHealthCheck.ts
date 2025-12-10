import { crearAgenteTesis } from '../mastra/agents';

/**
 * Resultado de la verificación de salud del modelo
 */
export interface ModelHealthResult {
    healthy: boolean;
    latency: number;
    error?: string;
    quotaAvailable: boolean;
    message: string;
}

/**
 * Verifica la salud del modelo haciendo un request pequeño de prueba
 */
export async function checkModelHealth(modelo: 'rapido' | 'razonamiento' | 'canvas' = 'rapido'): Promise<ModelHealthResult> {
    const startTime = Date.now();

    try {
        console.log(`🏥 [HEALTH CHECK] Verificando salud del modelo ${modelo}...`);

        // Crear agente con el modelo especificado
        const agente = crearAgenteTesis(modelo);

        // Hacer un request muy pequeño de prueba
        const testPrompt = 'Responde solo con "OK"';

        const resultado = await agente.generate([
            { role: 'user', content: testPrompt }
        ] as any);

        const latency = Date.now() - startTime;

        // Verificar que la respuesta sea válida
        if (!resultado || !resultado.text) {
            return {
                healthy: false,
                latency,
                quotaAvailable: false,
                error: 'Respuesta inválida del modelo',
                message: 'El modelo no respondió correctamente'
            };
        }

        console.log(`✅ [HEALTH CHECK] Modelo ${modelo} está saludable (latencia: ${latency}ms)`);

        return {
            healthy: true,
            latency,
            quotaAvailable: true,
            message: `Modelo ${modelo} operativo`
        };

    } catch (error: any) {
        const latency = Date.now() - startTime;

        // Detectar errores específicos
        const errorMessage = error.message || 'Error desconocido';
        const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('exceeded') || errorMessage.includes('429');
        const isOverloadedError = errorMessage.includes('overloaded') || errorMessage.includes('503');

        let message = 'Error al verificar el modelo';
        if (isQuotaError) {
            message = 'Cuota de API agotada. Por favor, espera e intenta nuevamente más tarde.';
        } else if (isOverloadedError) {
            message = 'Modelo sobrecargado. Por favor, intenta nuevamente en unos minutos.';
        }

        console.error(`❌ [HEALTH CHECK] Modelo ${modelo} no está disponible:`, errorMessage);

        return {
            healthy: false,
            latency,
            quotaAvailable: !isQuotaError,
            error: errorMessage,
            message
        };
    }
}

/**
 * Verifica si es seguro proceder con una operación costosa
 */
export async function isSafeToGenerate(modelo: 'rapido' | 'razonamiento' | 'canvas' = 'canvas'): Promise<{
    safe: boolean;
    reason?: string;
}> {
    const health = await checkModelHealth(modelo);

    if (!health.healthy) {
        return {
            safe: false,
            reason: health.message
        };
    }

    // Verificar latencia (si es muy alta, puede haber problemas)
    if (health.latency > 10000) { // 10 segundos
        return {
            safe: false,
            reason: 'Latencia muy alta del modelo. El servicio puede estar experimentando problemas.'
        };
    }

    return {
        safe: true
    };
}
