# Backend - Sistema de Aceptación de Proyectos

Backend desarrollado con Node.js, Express y TypeScript para el sistema de aceptación de proyectos.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Superset de JavaScript con tipado estático
- **SQLite** - Base de datos
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/      # Controladores (lógica de endpoints)
│   ├── routes/           # Definición de rutas
│   ├── models/           # Modelos de datos (acceso a BD)
│   ├── middleware/       # Middlewares (auth, validación, etc.)
│   ├── services/         # Servicios (lógica de negocio)
│   ├── utils/            # Utilidades
│   ├── types/            # Tipos TypeScript
│   ├── config/           # Configuración (DB, env, etc.)
│   └── app.ts            # Archivo principal
├── database/
│   └── database.db       # Archivo SQLite (se crea automáticamente)
├── .env                  # Variables de entorno
├── package.json
├── tsconfig.json
└── nodemon.json
```

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` en la raíz del backend:
```env
PORT=3000
DB_PATH=./database/database.db
JWT_SECRET=tu_secret_key_super_segura_aqui
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Verificar tipos
```bash
npm run type-check
```

## 📡 Endpoints

### Autenticación

- `POST /api/auth/registro` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil (requiere autenticación)

### Health Check

- `GET /api/health` - Verificar estado del servidor

## 🔐 Autenticación

Para acceder a rutas protegidas, incluir el header:
```
Authorization: Bearer <token>
```

## 📝 Notas

- La base de datos se crea automáticamente al iniciar el servidor
- Todas las tablas se inicializan en el primer arranque
- El servidor corre en `http://localhost:3000` por defecto










