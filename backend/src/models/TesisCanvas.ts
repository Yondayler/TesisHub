import db from '../config/database';

export interface TesisCanvas {
    id?: number;
    usuario_id: number;
    titulo: string;
    descripcion: string;
    carrera: string;
    tipo: 'desarrollo_software' | 'investigacion_campo' | 'estudio_caso' | 'revision_literatura';
    indice: string; // JSON stringified
    capitulos: string; // JSON stringified
    fecha_creacion?: string;
    fecha_actualizacion?: string;
}

export class TesisCanvasModel {
    /**
     * Inicializa la tabla de tesis canvas
     */
    static async inicializar(): Promise<void> {
        const sql = `
            CREATE TABLE IF NOT EXISTS tesis_canvas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                titulo TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                carrera TEXT NOT NULL,
                tipo TEXT NOT NULL,
                indice TEXT,
                capitulos TEXT,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `;

        return new Promise((resolve, reject) => {
            db.run(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Crea una nueva tesis
     */
    static async crear(tesis: TesisCanvas): Promise<number> {
        const sql = `
            INSERT INTO tesis_canvas (usuario_id, titulo, descripcion, carrera, tipo, indice, capitulos)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            db.run(
                sql,
                [
                    tesis.usuario_id,
                    tesis.titulo,
                    tesis.descripcion,
                    tesis.carrera,
                    tesis.tipo,
                    tesis.indice || null,
                    tesis.capitulos || null
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    /**
     * Obtiene todas las tesis de un usuario
     */
    static async obtenerPorUsuario(usuarioId: number): Promise<TesisCanvas[]> {
        const sql = `
            SELECT * FROM tesis_canvas 
            WHERE usuario_id = ? 
            ORDER BY fecha_actualizacion DESC
        `;

        return new Promise((resolve, reject) => {
            db.all(sql, [usuarioId], (err, rows: TesisCanvas[]) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Obtiene una tesis por ID
     */
    static async obtenerPorId(id: number, usuarioId: number): Promise<TesisCanvas | null> {
        const sql = `
            SELECT * FROM tesis_canvas 
            WHERE id = ? AND usuario_id = ?
        `;

        return new Promise((resolve, reject) => {
            db.get(sql, [id, usuarioId], (err, row: TesisCanvas) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    /**
     * Actualiza una tesis
     */
    static async actualizar(id: number, usuarioId: number, datos: Partial<TesisCanvas>): Promise<void> {
        const campos: string[] = [];
        const valores: any[] = [];

        if (datos.titulo !== undefined) {
            campos.push('titulo = ?');
            valores.push(datos.titulo);
        }
        if (datos.descripcion !== undefined) {
            campos.push('descripcion = ?');
            valores.push(datos.descripcion);
        }
        if (datos.carrera !== undefined) {
            campos.push('carrera = ?');
            valores.push(datos.carrera);
        }
        if (datos.tipo !== undefined) {
            campos.push('tipo = ?');
            valores.push(datos.tipo);
        }
        if (datos.indice !== undefined) {
            campos.push('indice = ?');
            valores.push(datos.indice);
        }
        if (datos.capitulos !== undefined) {
            campos.push('capitulos = ?');
            valores.push(datos.capitulos);
        }

        campos.push('fecha_actualizacion = CURRENT_TIMESTAMP');

        valores.push(id, usuarioId);

        const sql = `
            UPDATE tesis_canvas 
            SET ${campos.join(', ')}
            WHERE id = ? AND usuario_id = ?
        `;

        return new Promise((resolve, reject) => {
            db.run(sql, valores, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Elimina una tesis
     */
    static async eliminar(id: number, usuarioId: number): Promise<void> {
        const sql = `DELETE FROM tesis_canvas WHERE id = ? AND usuario_id = ?`;

        return new Promise((resolve, reject) => {
            db.run(sql, [id, usuarioId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
