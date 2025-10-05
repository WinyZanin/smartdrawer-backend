import prisma from '../../db/prisma';
import { Device, CreateDeviceDto, UpdateDeviceDto } from '../../types/devices.types';
import Logger from '../../logger/logger';

/**
 * DevicesRepository
 *
 * Handles all database operations related to devices.
 * This class encapsulates all data access logic, providing a clean
 * interface for the service layer to interact with the database.
 */
export class DevicesRepository {
  private logger = Logger.child({ component: 'DevicesRepository' });

  /**
   * Find all devices in the database
   * @returns Promise<Device[]> Array of all devices
   */
  async findAll(): Promise<Device[]> {
    this.logger.debug('Fetching all devices from database');
    try {
      const devices = await prisma.device.findMany({
        orderBy: { createdAt: 'desc' },
      });
      this.logger.debug(`Retrieved ${devices.length} devices from database`);
      return devices;
    } catch (error) {
      this.logger.error('Database error in findAll', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find a device by its unique identifier
   * @param id - The device ID
   * @returns Promise<Device | null> The device if found, null otherwise
   */
  async findById(id: string): Promise<Device | null> {
    this.logger.debug('Finding device by ID', { deviceId: id });
    try {
      const device = await prisma.device.findUnique({
        where: { id },
      });
      this.logger.debug(`Device ${device ? 'found' : 'not found'}`, { deviceId: id });
      return device;
    } catch (error) {
      this.logger.error('Database error in findById', {
        deviceId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find devices by status
   * @param status - The device status to filter by
   * @returns Promise<Device[]> Array of devices with the specified status
   */
  async findByStatus(status: string): Promise<Device[]> {
    return prisma.device.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find devices by location
   * @param location - The device location to filter by
   * @returns Promise<Device[]> Array of devices at the specified location
   */
  async findByLocation(location: string): Promise<Device[]> {
    return prisma.device.findMany({
      where: { location },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new device in the database
   * @param data - The device data to create
   * @returns Promise<Device> The created device
   */
  async create(data: CreateDeviceDto): Promise<Device> {
    this.logger.debug('Creating new device', { deviceName: data.name });
    try {
      const now = new Date();
      const device = await prisma.device.create({
        data: {
          name: data.name,
          location: data.location || null,
          status: data.status || 'INACTIVE',
          secret: data.secret,
          deviceStatus: {
            create: {
              lastPoll: now,
              lastCommand: now,
            },
          },
        },
        include: { deviceStatus: true },
      });
      this.logger.info('Device created successfully', {
        deviceId: device.id,
        deviceName: device.name,
      });
      return device;
    } catch (error) {
      this.logger.error('Database error in create', {
        deviceName: data.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Atualiza o lastPoll de um DeviceStatus
   * @param deviceId - O ID do dispositivo
   * @returns Promise<void>
   */
  async updateLastPoll(deviceId: string): Promise<void> {
    await prisma.deviceStatus.update({
      where: { deviceId },
      data: { lastPoll: new Date() },
    });
  }

  /**
   * Atualiza o lastCommand de um DeviceStatus
   * @param deviceId - O ID do dispositivo
   * @returns Promise<void>
   */
  async updateLastCommand(deviceId: string): Promise<void> {
    await prisma.deviceStatus.update({
      where: { deviceId },
      data: { lastCommand: new Date() },
    });
  }

  /**
   * Busca o status de um dispositivo
   * @param deviceId - O ID do dispositivo
   * @returns Promise<DeviceStatus | null>
   */
  async getDeviceStatus(deviceId: string) {
    return prisma.deviceStatus.findUnique({
      where: { deviceId },
    });
  }

  /**
   * Update an existing device
   * @param id - The device ID to update
   * @param data - The updated device data
   * @returns Promise<Device> The updated device
   */
  async update(id: string, data: UpdateDeviceDto): Promise<Device> {
    return prisma.device.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.status && { status: data.status }),
        ...(data.secret && { secret: data.secret }),
      },
    });
  }

  /**
   * Delete a device from the database
   * @param id - The device ID to delete
   * @returns Promise<void>
   */
  async delete(id: string): Promise<void> {
    await prisma.device.delete({
      where: { id },
    });
  }

  /**
   * Check if a device exists
   * @param id - The device ID to check
   * @returns Promise<boolean> True if device exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.device.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Count devices by status
   * @param status - Optional status filter
   * @returns Promise<number> Number of devices
   */
  async countByStatus(status?: string): Promise<number> {
    return prisma.device.count({
      where: status ? { status } : undefined,
    });
  }
}
