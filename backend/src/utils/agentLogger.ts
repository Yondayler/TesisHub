import { apiLogger, APICallLog } from '../utils/apiLogger';
import { TokenCounter } from '../utils/tokenCounter';

/**
 * Wrapper para logging automático de llamadas a agentes
 */
export class AgentWithLogging {
    constructor(
        private agent: any,
        private modelName: string
    ) { }

    /**
     * Wrapper para generate() con logging automático
     */
    async generate(messages: any[], options?: any): Promise<any> {
        const operation = options?.operation || 'generate';
        const startTime = Date.now();

        // Estimar tokens de entrada
        const inputTokens = TokenCounter.estimateMessages(messages);

        try {
            // Pasar opciones al agente (excluyendo 'operation' que es solo para logging)
            const agentOptions = options ? { ...options } : undefined;
            if (agentOptions) {
                delete agentOptions.operation;
            }

            const resultado = agentOptions
                ? await this.agent.generate(messages, agentOptions)
                : await this.agent.generate(messages);

            const duration = Date.now() - startTime;

            // Extraer tokens de salida
            const outputTokens = TokenCounter.estimate(resultado.text || '');
            const totalTokens = inputTokens + outputTokens;

            // Registrar llamada exitosa
            const logEntry: APICallLog = {
                timestamp: new Date(),
                model: this.modelName,
                operation,
                inputTokens,
                outputTokens,
                totalTokens,
                duration,
                status: 'success'
            };

            apiLogger.log(logEntry);

            return resultado;

        } catch (error: any) {
            const duration = Date.now() - startTime;

            // Registrar llamada fallida
            const logEntry: APICallLog = {
                timestamp: new Date(),
                model: this.modelName,
                operation,
                inputTokens,
                outputTokens: 0,
                totalTokens: inputTokens,
                duration,
                status: 'error',
                error: error.message || 'Error desconocido'
            };

            apiLogger.log(logEntry);

            throw error;
        }
    }

    /**
   * Wrapper para stream() con logging automático
   * Nota: El conteo de tokens de salida se hace en el servicio que consume el stream
   */
    async stream(messages: any[], options?: any): Promise<any> {
        const operation = options?.operation || 'stream';
        const startTime = Date.now();

        // Estimar tokens de entrada
        const inputTokens = TokenCounter.estimateMessages(messages);

        try {
            // Pasar opciones al agente (excluyendo 'operation' que es solo para logging)
            const agentOptions = options ? { ...options } : undefined;
            if (agentOptions) {
                delete agentOptions.operation;
            }

            const result = agentOptions
                ? await this.agent.stream(messages, agentOptions)
                : await this.agent.stream(messages);

            // Registrar inicio del stream (sin tokens de salida aún)
            const logEntry: APICallLog = {
                timestamp: new Date(),
                model: this.modelName,
                operation,
                inputTokens,
                outputTokens: 0, // Se actualizará cuando termine el stream
                totalTokens: inputTokens,
                duration: Date.now() - startTime,
                status: 'success'
            };

            apiLogger.log(logEntry);

            return result;

        } catch (error: any) {
            const duration = Date.now() - startTime;

            const logEntry: APICallLog = {
                timestamp: new Date(),
                model: this.modelName,
                operation,
                inputTokens,
                outputTokens: 0,
                totalTokens: inputTokens,
                duration,
                status: 'error',
                error: error.message || 'Error desconocido'
            };

            apiLogger.log(logEntry);

            throw error;
        }
    }
}
