import { Request, Response } from 'express';

import { devicesService } from '../../container';
import Logger from '../../logger/logger';
import { DeviceAuthService } from '../../services/devices/DeviceAuthService';

/**
 * Controller para autenticação de dispositivos
 */
export class DeviceAuthController {
  private logger = Logger.child({ component: 'DeviceAuthController' });
  private deviceAuthService = new DeviceAuthService();

  constructor() {
    this.deviceAuthService = new DeviceAuthService();
    this.logger.debug('DeviceAuthController initialized');
  }

  /**
   * Autentica um dispositivo e retorna um token JWT
   */
  async authenticateDevice(req: Request, res: Response) {
    if (!req.body || typeof req.body !== 'object') {
      this.logger.warn('Authentication failed - invalid request body', {
        requestBody: req.body,
        bodyType: typeof req.body,
        isNull: req.body === null,
      });
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { device_id, secret }: { device_id: string; secret: string } = req.body;

    this.logger.info('Device authentication attempt', { device_id, requestBody: req.body });

    try {
      if (!device_id || !secret) {
        this.logger.warn('Authentication failed - missing credentials', {
          device_id,
          secret: secret ? '[REDACTED]' : 'undefined',
          hasDeviceId: !!device_id,
          hasSecret: !!secret,
        });
        return res.status(400).json({ error: 'Device ID and secret are required' });
      }

      this.logger.debug('Calling devicesService.getDeviceById', {
        device_id,
        device_id_type: typeof device_id,
        device_id_length: device_id?.length,
      });

      const device = await devicesService.getDeviceById(device_id);

      this.logger.debug('Device lookup result', {
        device_id,
        found: !!device,
        deviceExists: device !== null,
      });

      if (!device || device.secret !== secret) {
        this.logger.warn('Authentication failed - invalid credentials', {
          device_id,
          deviceFound: !!device,
          secretMatch: device ? device.secret === secret : false,
        });
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = await this.deviceAuthService.generateToken(device.id, 'device');
      //const token = jwt.sign({ sub: device.id, type: 'device' }, JWT_SECRET, { expiresIn: '1h' });

      this.logger.info('Device authenticated successfully', { device_id: device.id });
      res.json({ token });
    } catch (error) {
      this.logger.error('Authentication error', {
        device_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
