import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import devicesRoutes from './routes/devices/devices.routes';
import commandsRoutes from './routes/commands/commands.routes';
import healthRoutes from './routes/health.routes';
import { setupSwagger } from './config/swagger';
import Logger, { logInitialConfig } from './logger/logger';
import morganMiddleware from './logger/morganMiddleware';
import authRoutes from './routes/auth.routes';
//import jwt from 'jsonwebtoken';

/**
 * Configuração do servidor Express
 */
const app = express();

// Initialize logger configuration logging
logInitialConfig(Logger);

// Middlewares
app.use(cors());
app.use(json());

// Morgan middleware
app.use(morganMiddleware);

// Setup Swagger documentation (only in development)
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
  Logger.info('Swagger documentation enabled for development');
} else {
  Logger.info('Swagger documentation disabled in production');
}

Logger.info('App initialized');

// rotas principais
app.use('/api/v1/devices', devicesRoutes);
app.use('/api/v1/commands', commandsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', healthRoutes);

export default app;
