# Sistema de Aceptación de Proyectos

Sistema completo para la gestión y aceptación de proyectos desarrollado con Node.js, Express, React, TypeScript y SQLite.

ADMIN: 
Email: admin@tesishub.com
Contraseña: Admin123!

## 🚀 Tecnologías

### Backend
- Node.js + Express.js
- TypeScript
- SQLite
- JWT para autenticación
- bcryptjs para hash de contraseñas 

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- shadcn/ui + Tailwind CSS
- Axios

## 📁 Estructura del Proyecto

```
TesisHub/
├── backend/          # API REST con Express
├── frontend/         # Aplicación React
└── database.md       # Esquema de base de datos
```

## 🔧 Instalación y Configuración

### Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
PORT=3000
DB_PATH=./database/database.db
JWT_SECRET=tu_secret_key_super_segura
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Frontend

```bash
cd frontend
npm install
```

El archivo `.env` ya está configurado con:
```env
VITE_API_URL=http://localhost:3000/api
```

## 🏃 Ejecución

### Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
El backend estará en `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
El frontend estará en `http://localhost:5173`

## ✨ Funcionalidades Implementadas

### Autenticación
- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Protección de rutas
- ✅ Manejo de tokens JWT
- ✅ Context API para estado global

### UI/UX
- ✅ Diseño moderno con shadcn/ui
- ✅ Páginas de Login y Registro
- ✅ Dashboard con estadísticas
- ✅ Componentes reutilizables
- ✅ Responsive design

### Backend
- ✅ API REST completa
- ✅ Autenticación con JWT
- ✅ Base de datos SQLite
- ✅ Inicialización automática de BD
- ✅ Manejo de errores

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/registro` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil (requiere autenticación)

### Health Check
- `GET /api/health` - Estado del servidor

## 🔐 Flujo de Autenticación

1. Usuario se registra o inicia sesión
2. El backend genera un token JWT
3. El token se guarda en localStorage
4. Todas las peticiones incluyen el token automáticamente
5. Si el token expira, se redirige al login

## 📝 Próximos Pasos

- [ ] CRUD completo de proyectos
- [ ] Sistema de revisiones
- [ ] Subida de archivos
- [ ] Notificaciones
- [ ] Panel de administración
- [ ] Reportes y estadísticas

## 🛠️ Scripts Disponibles

### Backend
- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar producción
- `npm run type-check` - Verificar tipos

### Frontend
- `npm run dev` - Desarrollo con Vite
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run type-check` - Verificar tipos

## 📄 Licencia

ISC











