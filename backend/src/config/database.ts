import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database/database.db');

// Crear directorio de base de datos si no existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Crear conexión a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Wrapper promisificado para db.run que retorna lastID
export const dbRun = (sql: string, params?: any[]): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Wrapper promisificado para db.get
export const dbGet = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Wrapper promisificado para db.all
export const dbAll = (sql: string, params?: any[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Función para ejecutar queries
export const query = {
  run: dbRun,
  get: dbGet,
  all: dbAll,
};

// Función para cerrar la conexión
export const closeDatabase = () => {
  return new Promise<void>((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Conexión a la base de datos cerrada');
        resolve();
      }
    });
  });
};

export default db;

