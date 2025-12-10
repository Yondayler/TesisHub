import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/env';

// Configurar variable de entorno para Mastra (Google Provider)
if (config.geminiApiKey) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.geminiApiKey;
}

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './config/initDatabase';
import { initSocket } from './config/socket';

const app: Application = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Aumentado para soportar tesis grandes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar base de datos
initDatabase();

// Inicializar Socket.io
initSocket(httpServer);

// Rutas
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API del Sistema de Aceptación de Proyectos',
    version: '1.0.0',
  });
});

// Manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Entorno: ${config.nodeEnv}`);
  console.log(`🔌 Socket.io habilitado`);
});

export default app;







