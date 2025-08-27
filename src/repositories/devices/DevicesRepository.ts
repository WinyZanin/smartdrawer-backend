import prisma from '../../db/prisma';
import { Device, CreateDeviceDto, UpdateDeviceDto } from '../../types/devices.types';

/**
 * DevicesRepository
 *
 * Handles all database operations related to devices.
 * This class encapsulates all data access logic, providing a clean
 * interface for the service layer to interact with the database.
 */
export class DevicesRepository {
  /**
   * Find all devices in the database
   * @returns Promise<Device[]> Array of all devices
   */
  async findAll(): Promise<Device[]> {
    return prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a device by its unique identifier
   * @param id - The device ID
   * @returns Promise<Device | null> The device if found, null otherwise
   */
  async findById(id: string): Promise<Device | null> {
    return prisma.device.findUnique({
      where: { id },
    });
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
    return prisma.device.create({
      data: {
        name: data.name,
        location: data.location || null,
        status: data.status || 'INACTIVE',
      },
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
