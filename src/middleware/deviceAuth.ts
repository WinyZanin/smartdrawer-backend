import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import Logger from '../logger/logger';

const logger = Logger.child({ component: 'DeviceAuthMiddleware' });

/**
 * Extends the Express Request interface to include device information
 */
export interface AuthenticatedRequest extends Request {
  device?: {
    sub: string;
    type: string;
  };
}

/**
 * Middleware to authenticate device using JWT
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 * @returns JWT authentication result
 */
export function authenticateDeviceJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requestId = Math.random().toString(36).substring(7);

  logger.debug('JWT authentication attempt', {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
  });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('No token provided in request', { requestId });
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; type: string; iat: number; exp: number };

    logger.info('JWT validated successfully', {
      requestId,
      deviceId: decoded.sub,
      type: decoded.type,
    });

    req.device = decoded;
    next();
  } catch (err) {
    logger.warn('Invalid JWT token', {
      requestId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
}
