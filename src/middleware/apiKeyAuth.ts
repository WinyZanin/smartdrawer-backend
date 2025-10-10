import { Request, Response, NextFunction } from 'express';
import Logger from '../logger/logger';

const logger = Logger.child({ component: 'ApiKeyAuth' });

/**
 * Middleware de autenticação por API Key
 * Verifica se a requisição possui uma API Key válida no header 'X-API-Key'
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  logger.debug('API Key authentication attempt', {
    hasApiKey: !!apiKey,
    endpoint: req.path,
    method: req.method,
  });

  // Verificar se a API Key foi fornecida
  if (!apiKey) {
    logger.warn('API Key missing in request', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API Key is required. Please provide a valid API Key in the X-API-Key header.',
    });
    return;
  }

  // Verificar se a API Key é válida
  if (!validApiKey || apiKey !== validApiKey) {
    logger.warn('Invalid API Key provided', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      providedKey: apiKey.substring(0, 10) + '...',
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API Key provided.',
    });
    return;
  }

  logger.debug('API Key authentication successful', {
    endpoint: req.path,
    method: req.method,
  });

  // API Key válida, continuar para o próximo middleware/rota
  next();
};

/**
 * Middleware opcional de autenticação por API Key
 * Permite tanto API Key quanto acesso sem autenticação (para rotas públicas opcionais)
 */
export const optionalApiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  // Se não há API Key, continua normalmente (acesso público)
  if (!apiKey) {
    logger.debug('No API Key provided, allowing public access', {
      endpoint: req.path,
      method: req.method,
    });
    next();
    return;
  }

  // Se há API Key, deve ser válida
  if (validApiKey && apiKey === validApiKey) {
    logger.debug('Valid API Key provided, granting enhanced access', {
      endpoint: req.path,
      method: req.method,
    });
    next();
  } else {
    logger.warn('Invalid API Key provided in optional auth', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API Key provided.',
    });
  }
};
