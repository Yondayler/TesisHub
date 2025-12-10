import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { initDatabase } from '../src/config/initDatabase';
import { TesisReferenciaModel } from '../src/models/TesisReferencia';
import { config } from '../src/config/env';

// Intentar importar pdf-parse de forma compatible
let pdfParse: any;
try {
  pdfParse = require('pdf-parse-fork');
} catch (e) {
  console.error('Error importando pdf-parse-fork:', e);
}

// Cargar variables de entorno
dotenv.config();

const TESIS_DIR = path.join(__dirname, '../tesis');

async function procesarPDF(filePath: string) {
  const nombreArchivo = path.basename(filePath);
  console.log(`📄 Procesando: ${nombreArchivo}...`);
  
  // Verificar si ya existe usando el método exacto
  const existe = await TesisReferenciaModel.obtenerPorNombreArchivo(nombreArchivo);

  if (existe) {
    console.log(`⚠️ La tesis "${nombreArchivo}" ya existe en la base de datos. Saltando...`);
    return;
  }
  
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Usar pdf-parse
    let data;
    try {
      if (typeof pdfParse === 'function') {
        data = await pdfParse(dataBuffer);
      } else if (pdfParse.default && typeof pdfParse.default === 'function') {
        data = await pdfParse.default(dataBuffer);
      } else {
        // Fallback a extracción básica si la librería falla
        throw new Error('La librería pdf-parse no exporta una función válida.');
      }
    } catch (pdfError) {
      // Fallback: Usar Gemini File API directamente (multimodal)
      console.log('⚠️ Falló pdf-parse local, intentando modo multimodal con Gemini...');
      await procesarPDFConGeminiMultimodal(filePath);
      return;
    }

    const textoCompleto = data.text;
    console.log(`   ✅ Texto extraído: ${textoCompleto.length} caracteres.`);
    
    // Usar Gemini para analizar el texto
    console.log('   🤖 Analizando metadatos con Gemini 2.5...');
    
    if (!config.geminiApiKey) {
      console.warn('⚠️ No hay API Key de Gemini.');
      return;
    }

    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    // ACTUALIZADO: Usar modelo Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      Analiza el siguiente texto extraído de una tesis (primeras páginas y extractos) y extrae la siguiente información en formato JSON válido.
      
      Campos requeridos:
      - titulo: Título completo
      - autor: Nombre del autor
      - año: Año de publicación (número)
      - universidad: Universidad
      - carrera: Carrera
      - resumen: Resumen breve (max 500 caracteres)
      - metodologia: Breve descripción metodológica (si se encuentra)
      - palabras_clave: Palabras clave separadas por coma
      
      TEXTO DE LA TESIS:
      ${textoCompleto.substring(0, 15000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiar JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let metadatos: any = {};
    
    if (jsonMatch) {
      metadatos = JSON.parse(jsonMatch[0]);
    }

    // Guardar en BD
    const tesis = {
      titulo: metadatos.titulo || path.basename(filePath, '.pdf'),
      autor: metadatos.autor || 'Desconocido',
      año: parseInt(metadatos.año) || new Date().getFullYear(),
      universidad: metadatos.universidad || 'Universidad Privada Domingo Savio',
      carrera: metadatos.carrera || 'Ingeniería',
      area_conocimiento: 'Tecnología',
      resumen: metadatos.resumen || textoCompleto.substring(0, 300) + '...',
      metodologia: metadatos.metodologia || '',
      palabras_clave: metadatos.palabras_clave || '',
      contenido_completo: textoCompleto, // Guardamos todo el texto extraído
      archivo_pdf: path.basename(filePath),
      estado: 'disponible' as const
    };

    await TesisReferenciaModel.crear(tesis);
    console.log(`✅ Tesis guardada en BD: "${tesis.titulo}"`);

  } catch (error) {
    console.error(`❌ Error procesando ${path.basename(filePath)}:`, error);
  }
}

// Función de respaldo para usar Gemini Multimodal si pdf-parse falla
async function procesarPDFConGeminiMultimodal(filePath: string) {
  const { GoogleAIFileManager } = require('@google/generative-ai/server');
  const fileManager = new GoogleAIFileManager(config.geminiApiKey);
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log(`   📤 Subiendo archivo a Gemini...`);
  const uploadResult = await fileManager.uploadFile(filePath, {
    mimeType: 'application/pdf',
    displayName: path.basename(filePath),
  });

  // Esperar a que se procese (aunque flash es rápido)
  console.log(`   ✅ Archivo subido. Analizando...`);

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResult.file.mimeType,
        fileUri: uploadResult.file.uri
      }
    },
    { text: `Analiza esta tesis y extrae: titulo, autor, año, universidad, carrera, resumen, metodologia, palabras_clave. Devuelve JSON válido.` }
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const metadatos = JSON.parse(jsonMatch[0]);
    
    // Guardar
    const tesis = {
        titulo: metadatos.titulo || path.basename(filePath, '.pdf'),
        autor: metadatos.autor || 'Desconocido',
        año: parseInt(metadatos.año) || new Date().getFullYear(),
        universidad: metadatos.universidad || 'UPDS',
        carrera: metadatos.carrera || 'Ingeniería',
        area_conocimiento: 'Tecnología',
        resumen: metadatos.resumen || 'Sin resumen',
        metodologia: metadatos.metodologia || '',
        palabras_clave: metadatos.palabras_clave || '',
        contenido_completo: 'Contenido procesado por Gemini Multimodal (ver PDF original)', 
        archivo_pdf: path.basename(filePath),
        estado: 'disponible' as const
    };
    await TesisReferenciaModel.crear(tesis);
    console.log(`   ✅ Tesis guardada (Multimodal): "${tesis.titulo}"`);
  }
  
  // Limpiar
  await fileManager.deleteFile(uploadResult.file.name);
}

async function main() {
  console.log('🚀 Iniciando ingesta de tesis (Modo Texto)...');
  
  // Inicializar BD
  await initDatabase();

  if (!fs.existsSync(TESIS_DIR)) {
    console.error(`❌ El directorio ${TESIS_DIR} no existe.`);
    return;
  }

  const archivos = fs.readdirSync(TESIS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  if (archivos.length === 0) {
    console.log('⚠️ No se encontraron archivos PDF.');
    return;
  }

  console.log(`📚 Encontrados ${archivos.length} archivos PDF.`);

  for (const archivo of archivos) {
    await procesarPDF(path.join(TESIS_DIR, archivo));
  }

  console.log('✨ Proceso completado.');
}

main().catch(console.error);