import { dbAll, dbGet } from '../src/config/database';

async function verificarContenidoTesis() {
    try {
        console.log('🔍 Verificando contenido de tesis en la BD...\n');

        // Obtener todas las tesis
        const tesis = await dbAll('SELECT id, titulo, autor, LENGTH(contenido_completo) as longitud_contenido FROM tesis_referencias ORDER BY id', []);

        console.log(`📚 Total de tesis en la BD: ${tesis.length}\n`);

        if (tesis.length === 0) {
            console.log('⚠️  No hay tesis en la base de datos');
            return;
        }

        // Mostrar resumen de cada tesis
        console.log('═══════════════════════════════════════════════════════════════');
        tesis.forEach((t: any, index: number) => {
            console.log(`\n${index + 1}. ID: ${t.id}`);
            console.log(`   Título: ${t.titulo}`);
            console.log(`   Autor: ${t.autor}`);
            console.log(`   Longitud contenido_completo: ${t.longitud_contenido ? t.longitud_contenido.toLocaleString() : 0} caracteres`);

            if (!t.longitud_contenido || t.longitud_contenido === 0) {
                console.log('   ⚠️  VACÍO - No tiene contenido_completo');
            } else if (t.longitud_contenido < 1000) {
                console.log('   ⚠️  MUY CORTO - Probablemente incompleto');
            } else if (t.longitud_contenido < 10000) {
                console.log('   ✅ TIENE CONTENIDO - Parece un resumen o extracto');
            } else {
                console.log('   ✅ CONTENIDO COMPLETO - Parece tener el texto completo');
            }
        });

        // Mostrar preview de la primera tesis con contenido
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('\n📄 PREVIEW DE CONTENIDO (Primera tesis con datos):\n');

        const tesisConContenido: any = await dbGet(
            'SELECT id, titulo, contenido_completo FROM tesis_referencias WHERE contenido_completo IS NOT NULL AND LENGTH(contenido_completo) > 0 ORDER BY id LIMIT 1',
            []
        );

        if (tesisConContenido) {
            console.log(`ID: ${tesisConContenido.id}`);
            console.log(`Título: ${tesisConContenido.titulo}`);
            console.log(`\nPrimeros 1000 caracteres del contenido_completo:`);
            console.log('─────────────────────────────────────────────────────────────');
            console.log(tesisConContenido.contenido_completo.substring(0, 1000));
            console.log('─────────────────────────────────────────────────────────────');
            console.log(`\n... (${tesisConContenido.contenido_completo.length - 1000} caracteres más)`);

            // Verificar si tiene estructura de capítulos
            const tieneCapitulos = tesisConContenido.contenido_completo.match(/CAP[ÍI]TULO|CHAPTER|INTRODUCCIÓN|CONCLUSIÓN/gi);
            if (tieneCapitulos) {
                console.log(`\n✅ Detectados ${tieneCapitulos.length} marcadores de capítulos/secciones`);
                console.log('   Primeros marcadores encontrados:', tieneCapitulos.slice(0, 5).join(', '));
            } else {
                console.log('\n⚠️  No se detectaron marcadores típicos de capítulos');
            }
        } else {
            console.log('⚠️  No hay ninguna tesis con contenido_completo poblado');
        }

        console.log('\n═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error al verificar contenido:', error);
    }
}

// Ejecutar
verificarContenidoTesis()
    .then(() => {
        console.log('✅ Verificación completada');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
