import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MODELOS_A_PROBAR = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-3-pro-preview',
    'gemini-2.0-pro-exp',
    'gemini-exp-1206',
    'gemini-flash-latest',
    'gemini-pro-latest'
];

async function probarModelo(modelName: string, apiKey: string): Promise<{ modelo: string; funciona: boolean; error?: string }> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        // Hacer un request muy pequeño
        const result = await model.generateContent('Di solo "OK"');
        const response = await result.response;
        const text = response.text();

        return {
            modelo: modelName,
            funciona: true
        };
    } catch (error: any) {
        const errorMsg = error.message || error.toString();
        const esErrorCuota = errorMsg.includes('quota') || errorMsg.includes('exceeded') || errorMsg.includes('limit: 0');

        return {
            modelo: modelName,
            funciona: false,
            error: esErrorCuota ? 'Sin cuota (limit: 0)' : errorMsg.substring(0, 100)
        };
    }
}

async function probarTodosLosModelos() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No se encontró GEMINI_API_KEY');
        return;
    }

    console.log('🔍 Probando modelos con tu API key...\n');
    console.log('⏳ Esto puede tomar 1-2 minutos...\n');

    const resultados = [];

    for (const modelo of MODELOS_A_PROBAR) {
        process.stdout.write(`Probando ${modelo}... `);
        const resultado = await probarModelo(modelo, apiKey);
        resultados.push(resultado);

        if (resultado.funciona) {
            console.log('✅ FUNCIONA');
        } else {
            console.log(`❌ FALLA: ${resultado.error}`);
        }

        // Esperar 2 segundos entre requests para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE MODELOS DISPONIBLES');
    console.log('='.repeat(80) + '\n');

    const funcionan = resultados.filter(r => r.funciona);
    const noFuncionan = resultados.filter(r => !r.funciona);

    console.log('✅ MODELOS QUE FUNCIONAN:');
    if (funcionan.length === 0) {
        console.log('   Ninguno 😢');
    } else {
        funcionan.forEach(r => console.log(`   - ${r.modelo}`));
    }

    console.log('\n❌ MODELOS SIN CUOTA:');
    if (noFuncionan.length === 0) {
        console.log('   Ninguno 🎉');
    } else {
        noFuncionan.forEach(r => console.log(`   - ${r.modelo} (${r.error})`));
    }

    console.log('\n💡 RECOMENDACIÓN:');
    if (funcionan.length > 0) {
        console.log(`   Usa: ${funcionan[0].modelo}`);
    } else {
        console.log('   Ningún modelo disponible. Verifica tu API key.');
    }
}

probarTodosLosModelos();
