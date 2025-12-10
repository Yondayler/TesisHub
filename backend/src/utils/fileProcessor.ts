import fs from 'fs';
import path from 'path';

/**
 * Extrae texto de un archivo PDF
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
    try {
        console.log('📖 [PDF] Intentando extraer texto de:', filePath);

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            console.error('❌ [PDF] El archivo no existe:', filePath);
            throw new Error('El archivo PDF no existe');
        }

        console.log('✅ [PDF] Archivo existe, tamaño:', fs.statSync(filePath).size, 'bytes');

        console.log('📄 [PDF] Leyendo archivo...');
        const dataBuffer = fs.readFileSync(filePath);
        console.log('✅ [PDF] Archivo leído, buffer size:', dataBuffer.length, 'bytes');

        console.log('🔍 [PDF] Parseando PDF...');
        // Usar require para pdf-parse debido a problemas con ESM
        const pdfParseModule = require('pdf-parse');
        // pdf-parse puede exportar como default o directamente
        const pdfParseFn = pdfParseModule.default || pdfParseModule;
        const data = await pdfParseFn(dataBuffer);
        console.log('✅ [PDF] PDF parseado exitosamente');
        console.log('   - Páginas:', data.numpages);
        console.log('   - Texto extraído:', data.text.length, 'caracteres');
        console.log('   - Primeros 100 caracteres:', data.text.substring(0, 100));

        return data.text;
    } catch (error) {
        console.error('❌ [PDF] Error extrayendo texto de PDF:', error);
        console.error('   - Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('   - Error message:', error instanceof Error ? error.message : String(error));
        throw new Error('No se pudo extraer el texto del PDF');
    }
}

/**
 * Extrae texto de un archivo según su tipo
 */
export async function extractTextFromFile(filePath: string, mimetype: string): Promise<string> {
    try {
        // PDF
        if (mimetype === 'application/pdf') {
            return await extractTextFromPDF(filePath);
        }

        // Texto plano
        if (mimetype.startsWith('text/')) {
            return fs.readFileSync(filePath, 'utf-8');
        }

        // Para otros tipos (Word, imágenes), devolver mensaje informativo
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.doc' || ext === '.docx') {
            return '[Documento Word - El contenido no puede ser extraído automáticamente. Por favor, copia y pega el texto relevante.]';
        }

        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            return '[Imagen - El análisis de imágenes no está disponible actualmente.]';
        }

        return '[Tipo de archivo no soportado para extracción de texto]';
    } catch (error) {
        console.error('Error procesando archivo:', error);
        throw new Error('No se pudo procesar el archivo');
    }
}

/**
 * Trunca texto a un máximo de caracteres
 */
export function truncateText(text: string, maxLength: number = 10000): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '\n\n[... texto truncado por longitud ...]';
}
