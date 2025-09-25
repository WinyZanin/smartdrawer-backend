import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import devicesRoutes from './routes/devices/devices.routes';
import healthRoutes from './routes/health.routes';
import { setupSwagger } from './config/swagger';
import Logger from './logger/logger';
import morganMiddleware from './logger/morganMiddleware';
import authRoutes from './routes/auth.routes';
//import jwt from 'jsonwebtoken';

/**
 * Configuração do servidor Express
 */
const app = express();

// Middlewares
app.use(cors());
app.use(json());

// Morgan middleware
app.use(morganMiddleware);

// Setup Swagger documentation
setupSwagger(app);

Logger.info('App initialized');

// rotas principais
app.use('/api/v1/devices', devicesRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', healthRoutes);

// rota teste para autenticação jwt e http com esp32
//const SECRET = 'tester'; // precisa ser o mesmo usado no ESP32
//app.get('/token', (req, res) => {
//  const token = jwt.sign(
//    { device: 'esp32-01', role: 'device' }, // payload
//    SECRET,
//    { algorithm: 'HS256', expiresIn: '1h' }, // expira em 1h
//  );
//  res.json({ token });
//});

export default app;
