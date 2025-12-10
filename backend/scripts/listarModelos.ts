import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env correcto
dotenv.config({ path: path.join(__dirname, '../.env') });

async function listarModelos() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ No se encontró GEMINI_API_KEY en las variables de entorno.');
    return;
  }

  console.log('🔑 Usando API Key:', apiKey.substring(0, 5) + '...');

  try {
    // En las versiones recientes del SDK, no hay un método directo "listModels" expuesto fácilmente en la clase principal
    // pero podemos intentar instanciar un modelo genérico y ver si falla o si hay documentación sobre cómo listar.
    // Sin embargo, para debug, lo más rápido es hacer una petición REST simple a la API de listModels
    // ya que el SDK a veces oculta esta funcionalidad.
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.error) {
      console.error('❌ Error al listar modelos:', data.error);
      return;
    }

    if (!data.models) {
      console.log('⚠️ No se encontraron modelos o la respuesta es inesperada:', data);
      return;
    }

    console.log('\n📋 Modelos Disponibles:');
    console.log('================================');
    data.models.forEach((model: any) => {
      if (model.supportedGenerationMethods.includes('generateContent')) {
        console.log(`✅ ${model.name}`);
        console.log(`   - Versión: ${model.version}`);
        console.log(`   - Nombre: ${model.displayName}`);
        console.log('--------------------------------');
      }
    });

  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

listarModelos();
