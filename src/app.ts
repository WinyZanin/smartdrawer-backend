import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import devicesRoutes from './routes/devices/devices.routes';
import healthRoutes from './routes/health.routes';
import { setupSwagger } from './config/swagger';

/**
 * Configuração do servidor Express
 */
const app = express();

// Middlewares
app.use(cors());
app.use(json());

// Setup Swagger documentation
setupSwagger(app);

// rotas principais
app.use('/api/v1/devices', devicesRoutes);
app.use('/api/v1', healthRoutes);

export default app;
