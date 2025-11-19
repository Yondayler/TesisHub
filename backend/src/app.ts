import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './config/initDatabase';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar base de datos
initDatabase();

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Entorno: ${config.nodeEnv}`);
});

export default app;


