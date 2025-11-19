# Frontend - Sistema de Aceptación de Proyectos

Frontend desarrollado con React, Vite y TypeScript para el sistema de aceptación de proyectos.

## 🚀 Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **React Router** - Navegación
- **Axios** - Cliente HTTP

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/          # Páginas/vistas
│   ├── services/       # Servicios API
│   ├── hooks/          # Custom hooks
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades
│   ├── context/        # Context API
│   ├── App.tsx         # Componente principal
│   └── main.tsx        # Punto de entrada
├── public/             # Archivos estáticos
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔧 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` (ya está creado):
```env
VITE_API_URL=http://localhost:3000/api
```

## 🏃 Ejecución

### Desarrollo
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

### Producción
```bash
npm run build
npm run preview
```

### Verificar tipos
```bash
npm run type-check
```

## 📡 Funcionalidades

- ✅ Autenticación (Login/Registro)
- ✅ Rutas protegidas
- ✅ Context API para estado global
- ✅ Interceptores de Axios para tokens
- ✅ Manejo de errores

## 🔐 Autenticación

El sistema maneja automáticamente:
- Guardado de token en localStorage
- Envío de token en headers
- Redirección si token expira
- Protección de rutas


