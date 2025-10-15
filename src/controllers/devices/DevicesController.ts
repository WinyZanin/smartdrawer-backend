import { Request, Response } from 'express';
import { DevicesService } from '../../services/devices/DevicesService';
import { CreateDeviceDto, UpdateDeviceDto, DeviceStatus, CommandDto } from '../../types/devices.types';
import Logger from '../../logger/logger';

/**
 * DevicesController
 *
 * Handles HTTP requests related to devices.
 * This controller is responsible for request validation, response formatting,
 * and delegating business logic to the DevicesService.
 */
export class DevicesController {
  private devicesService: DevicesService;
  private logger = Logger.child({ component: 'DevicesController' });

  /**
   * Constructor - Injects the DevicesService dependency
   * @param devicesService - The service to handle business logic
   */
  constructor(devicesService: DevicesService) {
    this.devicesService = devicesService;
    this.logger.debug('DevicesController initialized');
  }

  /**
   * GET /devices
   * Retrieve all devices
   */
  getAllDevices = async (req: Request, res: Response): Promise<void> => {
    this.logger.info('Fetching all devices');
    try {
      const devices = await this.devicesService.getAllDevices();
      this.logger.info(`Retrieved ${devices.length} devices successfully`);

      res.status(200).json({
        success: true,
        data: devices,
        count: devices.length,
      });
    } catch (error) {
      this.logger.error('Failed to retrieve devices', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve devices',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices/:id
   * Retrieve a specific device by ID
   */
  getDeviceById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    this.logger.info('Fetching device by ID', { deviceId: id });

    try {
      const device = await this.devicesService.getDeviceById(id);

      if (!device) {
        this.logger.warn('Device not found', { deviceId: id });
        res.status(404).json({
          success: false,
          error: 'Device not found',
          message: `No device found with ID: ${id}`,
        });
        return;
      }

      this.logger.info('Device retrieved successfully', { deviceId: id });
      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;
      this.logger.error('Failed to retrieve device', {
        deviceId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode,
      });

      res.status(statusCode).json({
        success: false,
        error: 'Failed to retrieve device',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices?status=VALUE
   * Retrieve devices filtered by status
   */
  getDevicesByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;

      if (!status || typeof status !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Status parameter is required',
        });
        return;
      }

      const devices = await this.devicesService.getDevicesByStatus(status as DeviceStatus);

      res.status(200).json({
        success: true,
        data: devices,
        count: devices.length,
        filter: { status },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to retrieve devices by status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices?location=VALUE
   * Retrieve devices filtered by location
   */
  getDevicesByLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { location } = req.query;

      if (!location || typeof location !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Location parameter is required',
        });
        return;
      }

      const devices = await this.devicesService.getDevicesByLocation(location);

      res.status(200).json({
        success: true,
        data: devices,
        count: devices.length,
        filter: { location },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to retrieve devices by location',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices?status=VALUE&location=VALUE
   * Retrieve devices filtered by both status and location
   */
  getDevicesByFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, location } = req.query;

      if (!status || typeof status !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Status parameter is required',
        });
        return;
      }

      if (!location || typeof location !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Location parameter is required',
        });
        return;
      }

      // Validate status enum
      if (!['ACTIVE', 'INACTIVE', 'ERROR'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Status must be one of: ACTIVE, INACTIVE, ERROR',
        });
        return;
      }

      const devices = await this.devicesService.getDevicesByFilters(status as DeviceStatus, location);

      res.status(200).json({
        success: true,
        data: devices,
        count: devices.length,
        filter: { status, location },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to retrieve devices by filters',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * POST /devices
   * Create a new device
   */
  createDevice = async (req: Request, res: Response): Promise<void> => {
    const { name, location, status, secret }: CreateDeviceDto = req.body;

    this.logger.info('Creating new device', { deviceName: name, location });

    try {
      // Basic request validation
      if (!name) {
        this.logger.warn('Device creation failed - missing name');
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Device name is required',
        });
        return;
      }

      if (!secret) {
        this.logger.warn('Device creation failed - missing secret');
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Device secret is required',
        });
        return;
      }

      const deviceData: CreateDeviceDto = {
        name,
        location: location || null,
        status: (status as DeviceStatus) || undefined,
        secret,
      };

      const device = await this.devicesService.createDevice(deviceData);

      this.logger.info('Device created successfully', {
        deviceId: device.id,
        deviceName: device.name,
      });

      res.status(201).json({
        success: true,
        data: device,
        message: 'Device created successfully',
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;

      this.logger.error('Failed to create device', {
        deviceName: name,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode,
      });

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create device',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * PUT /devices/:id
   * Update an existing device
   */
  updateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, location, status, secret }: UpdateDeviceDto = req.body;

      const updateData: UpdateDeviceDto = {};

      if (name !== undefined) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (status !== undefined) updateData.status = status as DeviceStatus;
      if (secret !== undefined) updateData.secret = secret;

      const device = await this.devicesService.updateDevice(id, updateData);

      res.status(200).json({
        success: true,
        data: device,
        message: 'Device updated successfully',
      });
    } catch (error) {
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('required') || error.message.includes('Invalid')) {
          statusCode = 400;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: 'Failed to update device',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * DELETE /devices/:id
   * Delete a device
   */
  deleteDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.devicesService.deleteDevice(id);

      res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('required')) {
          statusCode = 400;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: 'Failed to delete device',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices/stats
   * Get device statistics
   */
  getDeviceStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.devicesService.getDeviceStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve device statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices/stats/:id
   * Get the status of a specific device
   */
  getDeviceStat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await this.devicesService.getDeviceStatus(id);

      if (!status) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
          message: `No device found with ID: ${id}`,
        });
        return;
      }

      res.status(200).json({ ...status });
    } catch (error) {
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('required')) {
          statusCode = 400;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: 'Failed to retrieve device status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * GET /devices/:id/next-command
   * Dispositivo faz polling para buscar próximo comando
   */
  getNextCommand = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Atualiza a ultima verificação de comandos do dispositivo
      this.devicesService.updateLastPoll(id);

      // Aqui você busca o próximo comando pendente para o dispositivo
      const command = await this.devicesService.getNextCommandForDevice(id);

      if (!command) {
        res.status(204).send(); // Sem comando pendente
        return;
      }

      res.status(200).json({ ...command });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch next command',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * POST /devices/:id/queue-command
   * Queue a command for the device
   */
  // Note: This endpoint would typically be protected to allow only authorized users to queue commands.
  queueCommand = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const command: CommandDto = {
        action: req.body.action,
        drawer: req.body.drawer,
      };

      if (
        !command ||
        typeof command.action !== 'string' ||
        !command.action ||
        typeof command.drawer !== 'number' ||
        isNaN(command.drawer)
      ) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Command must have a valid action (string) and drawer (number)' + JSON.stringify(command),
        });
        return;
      }

      await this.devicesService.queueCommandForDevice(id, command);

      res.status(200).json({
        success: true,
        message: 'Command queued successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to queue command',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Open a specific drawer for a device
   * @param req - The request object
   * @param res - The response object
   * @returns Promise<void>
   */
  openDrawer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, drawerNumber } = req.params;
      const drawerNumberInt = parseInt(drawerNumber, 10);

      if (isNaN(drawerNumberInt) || drawerNumberInt < 1) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Drawer index must be a positive integer',
        });
        return;
      }

      const commandCode = await this.devicesService.openDrawer(id, drawerNumberInt);

      res.status(200).json({
        success: true,
        message: `Drawer ${drawerNumberInt} open command queued successfully`,
        code: commandCode,
      });
    } catch (error) {
      let statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          statusCode = 404;
        } else if (error.message.includes('Invalid') || error.message.includes('out of range')) {
          statusCode = 400;
        }
      }

      res.status(statusCode).json({
        success: false,
        error: 'Failed to queue open drawer command',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Confirm command execution for a device
   * @param req - Express request object
   * @param res - Express response object
   */
  confirmCommandExecution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const command: string = req.body as string;

      await this.devicesService.updateLastCommandExecution(id, command);

      res.status(200).json({
        success: true,
        message: 'Command execution confirmed',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to confirm command execution',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
