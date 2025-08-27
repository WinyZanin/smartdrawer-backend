import { Request, Response } from 'express';
import { DevicesService } from '../../services/devices/DevicesService';
import { CreateDeviceDto, UpdateDeviceDto, DeviceStatus } from '../../types/devices.types';

/**
 * DevicesController
 *
 * Handles HTTP requests related to devices.
 * This controller is responsible for request validation, response formatting,
 * and delegating business logic to the DevicesService.
 */
export class DevicesController {
  private devicesService: DevicesService;

  /**
   * Constructor - Injects the DevicesService dependency
   * @param devicesService - The service to handle business logic
   */
  constructor(devicesService: DevicesService) {
    this.devicesService = devicesService;
  }

  /**
   * GET /devices
   * Retrieve all devices
   */
  getAllDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const devices = await this.devicesService.getAllDevices();

      res.status(200).json({
        success: true,
        data: devices,
        count: devices.length,
      });
    } catch (error) {
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
    try {
      const { id } = req.params;
      const device = await this.devicesService.getDeviceById(id);

      if (!device) {
        res.status(404).json({
          success: false,
          error: 'Device not found',
          message: `No device found with ID: ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: device,
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;

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
   * POST /devices
   * Create a new device
   */
  createDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      // Basic request validation
      const { name, location, status }: CreateDeviceDto = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Device name is required',
        });
        return;
      }

      const deviceData: CreateDeviceDto = {
        name,
        location: location || null,
        status: (status as DeviceStatus) || undefined,
      };

      const device = await this.devicesService.createDevice(deviceData);

      res.status(201).json({
        success: true,
        data: device,
        message: 'Device created successfully',
      });
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;

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
      const { name, location, status }: UpdateDeviceDto = req.body;

      const updateData: UpdateDeviceDto = {};

      if (name !== undefined) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (status !== undefined) updateData.status = status as DeviceStatus;

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
}
