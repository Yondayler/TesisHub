import express, { Application } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/env';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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







