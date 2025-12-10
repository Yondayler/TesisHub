/**
 * Estimador simple de tokens basado en caracteres
 * Regla general: 1 token ≈ 4 caracteres para inglés/español
 */
export class TokenCounter {
    private static readonly CHARS_PER_TOKEN = 4;

    /**
     * Estima tokens basándose en el número de caracteres
     */
    static estimate(text: string): number {
        if (!text) return 0;
        return Math.ceil(text.length / this.CHARS_PER_TOKEN);
    }

    /**
     * Estima tokens de un array de mensajes
     */
    static estimateMessages(messages: Array<{ role: string; content: string }>): number {
        let total = 0;
        for (const msg of messages) {
            // Agregar overhead por estructura del mensaje (~4 tokens por mensaje)
            total += 4;
            total += this.estimate(msg.content);
        }
        return total;
    }

    /**
     * Extrae conteo real de tokens de la respuesta de la API si está disponible
     */
    static extractFromResponse(response: any): {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    } {
        // Intentar extraer de diferentes estructuras de respuesta
        const usage = response?.usage || response?.metadata?.usage;

        if (usage) {
            return {
                inputTokens: usage.promptTokens || usage.input_tokens || 0,
                outputTokens: usage.completionTokens || usage.output_tokens || 0,
                totalTokens: usage.totalTokens || usage.total_tokens || 0
            };
        }

        // Si no hay información de uso, retornar 0
        return {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0
        };
    }
}
