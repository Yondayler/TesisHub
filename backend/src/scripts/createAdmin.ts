import { UsuarioModel } from '../models/Usuario';
import { Usuario } from '../types';

async function createAdminUser() {
  try {
    // Datos del administrador
    const adminData: Usuario = {
      email: 'admin@tesishub.com',
      password: 'Admin123!',
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: 'administrador',
      activo: 1,
    };

    console.log('Creando usuario administrador...');

    // Verificar si ya existe
    const existingAdmin = await UsuarioModel.obtenerPorEmail(adminData.email);
    if (existingAdmin) {
      console.log('El usuario administrador ya existe:', existingAdmin.email);
      return;
    }

    // Crear el usuario administrador
    const adminId = await UsuarioModel.crear(adminData);
    const admin = await UsuarioModel.obtenerPorId(adminId);

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('- Email:', admin?.email);
    console.log('- Nombre:', admin?.nombre, admin?.apellido);
    console.log('- Rol:', admin?.rol);
    console.log('- ID:', admin?.id);

  } catch (error) {
    console.error('❌ Error al crear el usuario administrador:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser().then(() => {
    console.log('Script completado.');
    process.exit(0);
  }).catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
}

export { createAdminUser };








