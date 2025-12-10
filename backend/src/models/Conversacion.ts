import { query } from '../config/database';

export interface Conversacion {
    id: number;
    usuario_id: number;
    proyecto_id?: number;
    titulo: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export class ConversacionModel {
    static async crear(datos: Omit<Conversacion, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<Conversacion> {
        const result = await query.run(
            `INSERT INTO conversaciones (usuario_id, proyecto_id, titulo)
       VALUES (?, ?, ?)`,
            [datos.usuario_id, datos.proyecto_id || null, datos.titulo]
        );

        if (!result.lastID) {
            throw new Error('Error al crear la conversación');
        }

        const nuevaConversacion = await this.obtenerPorId(result.lastID);
        if (!nuevaConversacion) {
            throw new Error('Error al recuperar la conversación creada');
        }

        return nuevaConversacion;
    }

    static async obtenerPorId(id: number): Promise<Conversacion | null> {
        const conversacion = await query.get(
            'SELECT * FROM conversaciones WHERE id = ?',
            [id]
        ) as Conversacion;
        return conversacion || null;
    }

    static async listarPorUsuario(usuarioId: number, proyectoId?: number): Promise<Conversacion[]> {
        let sql = 'SELECT * FROM conversaciones WHERE usuario_id = ?';
        const params: any[] = [usuarioId];

        if (proyectoId) {
            sql += ' AND proyecto_id = ?';
            params.push(proyectoId);
        }

        sql += ' ORDER BY fecha_actualizacion DESC';

        return await query.all(sql, params) as Conversacion[];
    }

    static async actualizarTitulo(id: number, titulo: string): Promise<void> {
        await query.run(
            'UPDATE conversaciones SET titulo = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
            [titulo, id]
        );
    }

    static async actualizarFecha(id: number): Promise<void> {
        await query.run(
            'UPDATE conversaciones SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    static async eliminar(id: number): Promise<void> {
        await query.run('DELETE FROM conversaciones WHERE id = ?', [id]);
    }
}
