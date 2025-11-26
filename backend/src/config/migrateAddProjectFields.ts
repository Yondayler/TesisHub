import { query } from './database';

export async function migrateAddProjectFields() {
  try {
    // Verificar si las columnas ya existen antes de agregarlas
    const tableInfo = await query.all('PRAGMA table_info(proyectos)') as Array<{ name: string }>;
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('planteamiento')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN planteamiento TEXT');
      console.log('✓ Columna "planteamiento" agregada');
    }

    if (!columnNames.includes('solucion_problema')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN solucion_problema TEXT');
      console.log('✓ Columna "solucion_problema" agregada');
    }

    if (!columnNames.includes('diagnosticos')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN diagnosticos TEXT');
      console.log('✓ Columna "diagnosticos" agregada');
    }

    if (!columnNames.includes('antecedentes')) {
      await query.run('ALTER TABLE proyectos ADD COLUMN antecedentes TEXT');
      console.log('✓ Columna "antecedentes" agregada');
    }

    console.log('✓ Migración de campos de proyecto completada');
  } catch (error) {
    console.error('Error en migración:', error);
    throw error;
  }
}






