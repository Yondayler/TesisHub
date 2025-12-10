
import { query } from './src/config/database';

async function migrateChat() {
    try {
        console.log('🚀 Iniciando migración de chat...');

        // 1. Crear tabla conversaciones
        await query.run(`
      CREATE TABLE IF NOT EXISTS conversaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        proyecto_id INTEGER,
        titulo TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
      )
    `);
        console.log('✅ Tabla conversaciones creada');

        // 2. Agregar columna conversacion_id a mensajes_chat si no existe
        try {
            const tableInfo = await query.all('PRAGMA table_info(mensajes_chat)') as Array<{ name: string }>;
            const columnNames = tableInfo.map(col => col.name);

            if (!columnNames.includes('conversacion_id')) {
                await query.run('ALTER TABLE mensajes_chat ADD COLUMN conversacion_id INTEGER REFERENCES conversaciones(id) ON DELETE CASCADE');
                console.log('✅ Columna conversacion_id agregada a mensajes_chat');
            }
        } catch (error) {
            console.log('⚠️ Error verificando columna conversacion_id (puede que ya exista)');
        }

        // 3. Migrar mensajes existentes a conversaciones
        // Agrupar mensajes por proyecto_id (o usuario_id si no hay proyecto)
        const mensajesSinConversacion = await query.all(`
      SELECT usuario_id, proyecto_id, COUNT(*) as count 
      FROM mensajes_chat 
      WHERE conversacion_id IS NULL 
      GROUP BY usuario_id, proyecto_id
    `) as Array<{ usuario_id: number, proyecto_id: number | null, count: number }>;

        console.log(`Found ${mensajesSinConversacion.length} groups of messages to migrate`);

        for (const group of mensajesSinConversacion) {
            // Crear conversación
            const titulo = group.proyecto_id ? `Chat de Proyecto ${group.proyecto_id}` : 'Chat General';

            const result = await query.run(`
        INSERT INTO conversaciones (usuario_id, proyecto_id, titulo)
        VALUES (?, ?, ?)
      `, [group.usuario_id, group.proyecto_id, titulo]);

            const conversacionId = result.lastID;

            // Actualizar mensajes
            let sql = 'UPDATE mensajes_chat SET conversacion_id = ? WHERE usuario_id = ? AND conversacion_id IS NULL';
            const params: any[] = [conversacionId, group.usuario_id];

            if (group.proyecto_id) {
                sql += ' AND proyecto_id = ?';
                params.push(group.proyecto_id);
            } else {
                sql += ' AND proyecto_id IS NULL';
            }

            await query.run(sql, params);
            console.log(`✅ Migrados ${group.count} mensajes a conversación ${conversacionId}`);
        }

        console.log('🎉 Migración completada');

    } catch (error) {
        console.error('❌ Error en migración:', error);
    }
}

migrateChat();
