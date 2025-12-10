import chalk from 'chalk';

/**
 * Interfaz para registro de llamadas a la API
 */
export interface APICallLog {
    timestamp: Date;
    model: string;
    operation: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    duration: number;
    status: 'success' | 'error';
    error?: string;
    userId?: number;
}

/**
 * Clase para logging centralizado de llamadas a la API
 */
class APILogger {
    private logs: APICallLog[] = [];
    private readonly MAX_LOGS = 1000; // Mantener solo los últimos 1000 logs en memoria

    /**
     * Registra una llamada a la API
     */
    log(logEntry: APICallLog): void {
        this.logs.push(logEntry);

        // Mantener solo los últimos MAX_LOGS
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.shift();
        }

        // Log en consola con formato bonito
        this.logToConsole(logEntry);
    }

    /**
     * Calcula el costo estimado según el proveedor y modelo
     */
    private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        const modelLower = model.toLowerCase();

        // Groq es gratuito
        if (modelLower.includes('groq')) {
            return 0;
        }

        // Gemini 2.5 Flash pricing (por 1M tokens)
        if (modelLower.includes('gemini-2.5-flash') || modelLower.includes('gemini/gemini-2.5-flash')) {
            const inputCost = (inputTokens / 1_000_000) * 0.075;  // $0.075 per 1M input tokens
            const outputCost = (outputTokens / 1_000_000) * 0.30;  // $0.30 per 1M output tokens
            return inputCost + outputCost;
        }

        // Gemini Pro pricing (fallback)
        const inputCost = (inputTokens / 1000) * 0.00125;
        const outputCost = (outputTokens / 1000) * 0.005;
        return inputCost + outputCost;
    }

    /**
     * Imprime log en consola con colores
     */
    private logToConsole(log: APICallLog): void {
        const timestamp = log.timestamp.toISOString();
        const statusIcon = log.status === 'success' ? '✅' : '❌';
        const statusColor = log.status === 'success' ? chalk.green : chalk.red;

        console.log('\n' + chalk.cyan('━'.repeat(80)));
        console.log(chalk.bold.white(`${statusIcon} API Call Log - ${timestamp}`));
        console.log(chalk.cyan('━'.repeat(80)));
        console.log(chalk.yellow('Operation:'), chalk.white(log.operation));
        console.log(chalk.yellow('Model:'), chalk.white(log.model));
        console.log(chalk.yellow('Duration:'), chalk.white(`${log.duration}ms`));
        console.log(chalk.yellow('Status:'), statusColor(log.status.toUpperCase()));

        if (log.status === 'success') {
            console.log(chalk.yellow('Tokens:'));
            console.log(chalk.gray('  Input:'), chalk.white(log.inputTokens.toLocaleString()));
            console.log(chalk.gray('  Output:'), chalk.white(log.outputTokens.toLocaleString()));
            console.log(chalk.gray('  Total:'), chalk.bold.white(log.totalTokens.toLocaleString()));

            // Calcular costo estimado según proveedor
            const totalCost = this.calculateCost(log.model, log.inputTokens, log.outputTokens);

            if (totalCost === 0) {
                console.log(chalk.yellow('Estimated Cost:'), chalk.green.bold('FREE (Groq)'));
            } else {
                console.log(chalk.yellow('Estimated Cost:'), chalk.green(`$${totalCost.toFixed(6)}`));
            }
        } else if (log.error) {
            console.log(chalk.red('Error:'), chalk.white(log.error));
        }

        console.log(chalk.cyan('━'.repeat(80)) + '\n');
    }

    /**
     * Obtiene estadísticas de uso
     */
    getStats(timeWindow?: number): {
        totalCalls: number;
        successfulCalls: number;
        failedCalls: number;
        totalTokens: number;
        totalInputTokens: number;
        totalOutputTokens: number;
        estimatedCost: number;
        averageDuration: number;
        errorRate: number;
    } {
        let logsToAnalyze = this.logs;

        // Filtrar por ventana de tiempo si se especifica (en milisegundos)
        if (timeWindow) {
            const cutoffTime = Date.now() - timeWindow;
            logsToAnalyze = this.logs.filter(log => log.timestamp.getTime() > cutoffTime);
        }

        const totalCalls = logsToAnalyze.length;
        const successfulCalls = logsToAnalyze.filter(l => l.status === 'success').length;
        const failedCalls = totalCalls - successfulCalls;

        const totalInputTokens = logsToAnalyze.reduce((sum, log) => sum + log.inputTokens, 0);
        const totalOutputTokens = logsToAnalyze.reduce((sum, log) => sum + log.outputTokens, 0);
        const totalTokens = totalInputTokens + totalOutputTokens;

        // Calcular costo total usando el método calculateCost para cada log
        const estimatedCost = logsToAnalyze.reduce((sum, log) => {
            return sum + this.calculateCost(log.model, log.inputTokens, log.outputTokens);
        }, 0);

        const averageDuration = totalCalls > 0
            ? logsToAnalyze.reduce((sum, log) => sum + log.duration, 0) / totalCalls
            : 0;

        const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

        return {
            totalCalls,
            successfulCalls,
            failedCalls,
            totalTokens,
            totalInputTokens,
            totalOutputTokens,
            estimatedCost,
            averageDuration,
            errorRate
        };
    }

    /**
     * Imprime estadísticas en consola
     */
    printStats(timeWindow?: number): void {
        const stats = this.getStats(timeWindow);
        const timeLabel = timeWindow
            ? `Last ${timeWindow / 1000 / 60} minutes`
            : 'All time';

        console.log('\n' + chalk.cyan('═'.repeat(80)));
        console.log(chalk.bold.white(`📊 API Usage Statistics - ${timeLabel}`));
        console.log(chalk.cyan('═'.repeat(80)));
        console.log(chalk.yellow('Total Calls:'), chalk.white(stats.totalCalls));
        console.log(chalk.green('Successful:'), chalk.white(stats.successfulCalls));
        console.log(chalk.red('Failed:'), chalk.white(stats.failedCalls));
        console.log(chalk.yellow('Error Rate:'), chalk.white(`${stats.errorRate.toFixed(2)}%`));
        console.log(chalk.yellow('Avg Duration:'), chalk.white(`${stats.averageDuration.toFixed(0)}ms`));
        console.log(chalk.cyan('─'.repeat(80)));
        console.log(chalk.yellow('Token Usage:'));
        console.log(chalk.gray('  Input:'), chalk.white(stats.totalInputTokens.toLocaleString()));
        console.log(chalk.gray('  Output:'), chalk.white(stats.totalOutputTokens.toLocaleString()));
        console.log(chalk.gray('  Total:'), chalk.bold.white(stats.totalTokens.toLocaleString()));
        console.log(chalk.cyan('─'.repeat(80)));

        if (stats.estimatedCost === 0) {
            console.log(chalk.yellow('Estimated Cost:'), chalk.green.bold('FREE (Groq)'));
        } else {
            console.log(chalk.yellow('Estimated Cost:'), chalk.green.bold(`$${stats.estimatedCost.toFixed(4)}`));
        }

        console.log(chalk.cyan('═'.repeat(80)) + '\n');
    }

    /**
     * Obtiene los últimos N logs
     */
    getRecentLogs(count: number = 10): APICallLog[] {
        return this.logs.slice(-count);
    }

    /**
     * Imprime resumen de una sesión de generación (ej: tesis completa)
     */
    printSessionSummary(sessionLogs: APICallLog[], sessionName: string = 'Session'): void {
        if (sessionLogs.length === 0) {
            console.log(chalk.yellow('⚠️  No hay logs para esta sesión'));
            return;
        }

        // Agrupar por proveedor/modelo
        const modelo = sessionLogs[0]?.model || 'unknown';
        const proveedor = modelo.toLowerCase().includes('groq') ? 'Groq' : 'Gemini';

        // Calcular totales
        const totalCalls = sessionLogs.length;
        const successCalls = sessionLogs.filter(log => log.status === 'success').length;
        const failedCalls = totalCalls - successCalls;

        const totalInputTokens = sessionLogs.reduce((sum, log) => sum + log.inputTokens, 0);
        const totalOutputTokens = sessionLogs.reduce((sum, log) => sum + log.outputTokens, 0);
        const totalTokens = totalInputTokens + totalOutputTokens;

        // Calcular tiempo total REAL: desde el primer log hasta el último
        const primerTimestamp = sessionLogs[0].timestamp.getTime();
        const ultimoTimestamp = sessionLogs[sessionLogs.length - 1].timestamp.getTime();
        const tiempoTotalMs = ultimoTimestamp - primerTimestamp;
        const tiempoTotalSegundos = Math.floor(tiempoTotalMs / 1000);
        const minutos = Math.floor(tiempoTotalSegundos / 60);
        const segundos = tiempoTotalSegundos % 60;
        const tiempoFormateado = minutos > 0 ? `${minutos}m ${segundos}s` : `${segundos}s`;

        // Calcular costos
        const inputCost = this.calculateCost(modelo, totalInputTokens, 0);
        const outputCost = this.calculateCost(modelo, 0, totalOutputTokens);
        const totalCost = inputCost + outputCost;

        // Calcular ahorro vs Gemini si es Groq
        let ahorroVsGemini = 0;
        if (proveedor === 'Groq') {
            const geminiInputCost = (totalInputTokens / 1_000_000) * 0.075;
            const geminiOutputCost = (totalOutputTokens / 1_000_000) * 0.30;
            ahorroVsGemini = geminiInputCost + geminiOutputCost;
        }

        // Imprimir tabla bonita
        const ancho = 78;
        console.log('\n' + chalk.magenta('╔' + '═'.repeat(ancho) + '╗'));
        console.log(chalk.magenta('║') + chalk.bold.white(` 🎓 ${sessionName} - Resumen Final`.padEnd(ancho)) + chalk.magenta('║'));
        console.log(chalk.magenta('╠' + '═'.repeat(ancho) + '╣'));

        console.log(chalk.magenta('║') + ` ${chalk.bold('Proveedor:')}    ${chalk.cyan(proveedor)}`.padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('║') + ` ${chalk.bold('Modelo:')}       ${chalk.cyan(modelo)}`.padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('╠' + '─'.repeat(ancho) + '╣'));

        console.log(chalk.magenta('║') + chalk.bold(' Llamadas a la API:').padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('║') + `   Total:      ${chalk.yellow(totalCalls)}`.padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('║') + `   Exitosas:   ${chalk.green(successCalls)}`.padEnd(ancho + 9) + chalk.magenta('║'));
        if (failedCalls > 0) {
            console.log(chalk.magenta('║') + `   Fallidas:   ${chalk.red(failedCalls)}`.padEnd(ancho + 9) + chalk.magenta('║'));
        }
        console.log(chalk.magenta('╠' + '─'.repeat(ancho) + '╣'));

        console.log(chalk.magenta('║') + chalk.bold(' Uso de Tokens:').padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('║') + `   Input:      ${chalk.cyan(totalInputTokens.toLocaleString())} tokens`.padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('║') + `   Output:     ${chalk.cyan(totalOutputTokens.toLocaleString())} tokens`.padEnd(ancho + 9) + chalk.magenta('║'));
        console.log(chalk.magenta('║') + `   TOTAL:      ${chalk.bold.cyan(totalTokens.toLocaleString())} tokens`.padEnd(ancho + 18) + chalk.magenta('║'));
        console.log(chalk.magenta('╠' + '─'.repeat(ancho) + '╣'));

        console.log(chalk.magenta('║') + chalk.bold(' Costo Estimado:').padEnd(ancho + 9) + chalk.magenta('║'));
        if (proveedor === 'Groq') {
            console.log(chalk.magenta('║') + `   Costo:      ${chalk.bold.green('GRATIS (Groq)')}`.padEnd(ancho + 18) + chalk.magenta('║'));
            console.log(chalk.magenta('║') + `   Ahorro vs Gemini:~$${ahorroVsGemini.toFixed(4)}`.padEnd(ancho + 9) + chalk.magenta('║'));
        } else {
            console.log(chalk.magenta('║') + `   Input:      $${inputCost.toFixed(6)}`.padEnd(ancho + 9) + chalk.magenta('║'));
            console.log(chalk.magenta('║') + `   Output:     $${outputCost.toFixed(6)}`.padEnd(ancho + 9) + chalk.magenta('║'));
            console.log(chalk.magenta('║') + `   TOTAL:      ${chalk.bold.yellow('$' + totalCost.toFixed(4))}`.padEnd(ancho + 18) + chalk.magenta('║'));
        }
        console.log(chalk.magenta('╠' + '─'.repeat(ancho) + '╣'));

        console.log(chalk.magenta('║') + ` ${chalk.bold('Tiempo Total:')} ${chalk.cyan(tiempoFormateado)}`.padEnd(ancho + 18) + chalk.magenta('║'));
        console.log(chalk.magenta('╚' + '═'.repeat(ancho) + '╝') + '\n');
    }

    /**
     * Limpia todos los logs
     */
    clear(): void {
        this.logs = [];
    }
}

// Exportar instancia singleton
export const apiLogger = new APILogger();
