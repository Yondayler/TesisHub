import sqlite3 from 'sqlite3';
import path from 'path';

const tesisId = process.argv[2];

if (!tesisId) {
    console.error('❌ Debes proporcionar el ID de la tesis a eliminar');
    console.log('Uso: npx tsx scripts/eliminarTesis.ts <ID>');
    process.exit(1);
}

const dbPath = path.join(__dirname, '../database/database.db');
const db = new sqlite3.Database(dbPath);

const id = parseInt(tesisId);

db.serialize(() => {
    // Verificar si existe
    db.get('SELECT * FROM tesis_referencias WHERE id = ?', [id], (err, tesis: any) => {
        if (err) {
            console.error('❌ Error:', err);
            db.close();
            process.exit(1);
        }

        if (!tesis) {
            console.log(`⚠️  No se encontró ninguna tesis con ID ${id}`);
            db.close();
            process.exit(0);
        }

        console.log(`🗑️  Eliminando tesis con ID: ${id}...`);
        console.log(`📄 Tesis a eliminar: "${tesis.titulo}" - ${tesis.autor}`);

        // Eliminar
        db.run('DELETE FROM tesis_referencias WHERE id = ?', [id], function (err) {
            if (err) {
                console.error('❌ Error al eliminar:', err);
                db.close();
                process.exit(1);
            }

            console.log(`✅ Tesis con ID ${id} eliminada exitosamente (${this.changes} registro(s) eliminado(s))`);

            // Mostrar tesis restantes
            db.all('SELECT id, titulo, autor FROM tesis_referencias ORDER BY id', [], (err, todasTesis: any[]) => {
                if (err) {
                    console.error('❌ Error:', err);
                } else {
                    console.log('\n📚 Tesis restantes en la base de datos:');
                    console.log('=====================================');
                    todasTesis.forEach((t) => {
                        console.log(`ID ${t.id}: "${t.titulo}" - ${t.autor}`);
                    });
                }
                db.close();
            });
        });
    });
});
