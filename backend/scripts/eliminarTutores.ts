import { dbRun, dbAll } from '../src/config/database';

async function eliminarTutores() {
  try {
    console.log('Buscando tutores en la base de datos...');
    
    // Obtener todos los tutores
    const tutores = await dbAll(
      `SELECT id, email, nombre, apellido FROM usuarios WHERE rol = 'tutor'`
    );
    
    if (tutores.length === 0) {
      console.log('✅ No hay tutores en la base de datos');
      return;
    }
    
    console.log(`Encontrados ${tutores.length} tutor(es):`);
    tutores.forEach((tutor: any) => {
      console.log(`  - ${tutor.nombre} ${tutor.apellido} (${tutor.email})`);
    });
    
    // Eliminar todos los tutores
    const result = await dbRun(
      `DELETE FROM usuarios WHERE rol = 'tutor'`
    );
    
    console.log(`✅ ${result.changes} tutor(es) eliminado(s) exitosamente`);
    
  } catch (error: any) {
    console.error('❌ Error al eliminar tutores:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  eliminarTutores()
    .then(() => {
      console.log('Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { eliminarTutores };




