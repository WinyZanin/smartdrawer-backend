import { DevicesRepository } from '../../repositories/devices/DevicesRepository';
import { Device, CreateDeviceDto, UpdateDeviceDto, DeviceStatus, CommandDto } from '../../types/devices.types';
import Logger from '../../logger/logger';

/**
 * DevicesService
 *
 * Contains all business logic related to devices.
 * This service acts as an intermediary between controllers and repositories,
 * handling validation, business rules, and data transformation.
 */
export class DevicesService {
  private devicesRepository: DevicesRepository;
  private commandsQueue: Record<string, CommandDto[]> = {}; // Exemplo em memória
  private logger = Logger.child({ component: 'DevicesService' });

  /**
   * Constructor - Injects the DevicesRepository dependency
   * @param devicesRepository - The repository to handle data operations
   */
  constructor(devicesRepository: DevicesRepository) {
    this.devicesRepository = devicesRepository;
    this.logger.debug('DevicesService initialized');
  }

  /**
   * Retrieve all devices from the system
   * @returns Promise<Device[]> Array of all devices
   */
  async getAllDevices(): Promise<Device[]> {
    this.logger.debug('getAllDevices called');
    try {
      const devices = await this.devicesRepository.findAll();
      this.logger.info(`Found ${devices.length} devices in database`);
      return devices;
    } catch (error) {
      this.logger.error('Database error in getAllDevices', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to retrieve devices');
    }
  }

  /**
   * Retrieve a specific device by its ID
   * @param id - The device ID
   * @returns Promise<Device | null> The device if found, null otherwise
   * @throws Error if ID is invalid
   */
  async getDeviceById(id: string): Promise<Device | null> {
    const logger = this.logger.child({ method: 'getDeviceById' });
    logger.debug('DevicesService.getDeviceById called', {
      id,
      idType: typeof id,
      idLength: id?.length,
      isString: typeof id === 'string',
      isEmpty: !id || id.trim() === '',
    });

    if (!id || typeof id !== 'string' || id.trim() === '') {
      logger.warn('Invalid device ID provided', {
        id,
        idType: typeof id,
        isEmpty: !id,
        isWhitespace: typeof id === 'string' && id.trim() === '',
      });
      return null;
    }

    try {
      const device = await this.devicesRepository.findById(id);
      logger.debug('Device retrieval result', {
        id,
        found: !!device,
        deviceId: device?.id,
      });
      return device;
    } catch (error) {
      logger.error('Error retrieving device', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Retrieve devices filtered by status
   * @param status - The status to filter by
   * @returns Promise<Device[]> Array of devices with the specified status
   */
  async getDevicesByStatus(status: DeviceStatus): Promise<Device[]> {
    try {
      return await this.devicesRepository.findByStatus(status);
    } catch {
      throw new Error(`Failed to retrieve devices with status: ${status}`);
    }
  }

  /**
   * Retrieve devices filtered by location
   * @param location - The location to filter by
   * @returns Promise<Device[]> Array of devices at the specified location
   */
  async getDevicesByLocation(location: string): Promise<Device[]> {
    if (!location || location.trim() === '') {
      throw new Error('Location cannot be empty');
    }

    try {
      return await this.devicesRepository.findByLocation(location);
    } catch {
      throw new Error(`Failed to retrieve devices at location: ${location}`);
    }
  }

  /**
   * Retrieve devices filtered by both status and location
   * @param status - The status to filter by
   * @param location - The location to filter by
   * @returns Promise<Device[]> Array of devices matching both criteria
   */
  async getDevicesByFilters(status: DeviceStatus, location: string): Promise<Device[]> {
    if (!location || location.trim() === '') {
      throw new Error('Location cannot be empty');
    }

    try {
      return await this.devicesRepository.findByStatusAndLocation(status, location);
    } catch {
      throw new Error(`Failed to retrieve devices with status: ${status} and location: ${location}`);
    }
  }

  /**
   * Create a new device
   * @param deviceData - The device data to create
   * @returns Promise<Device> The created device
   * @throws Error if validation fails
   */
  async createDevice(deviceData: CreateDeviceDto): Promise<Device> {
    // Business rule: Name is required and must be meaningful
    if (!deviceData.name || deviceData.name.trim() === '') {
      throw new Error('Device name is required and cannot be empty');
    }

    // Business rule: Name should be at least 2 characters long
    if (deviceData.name.trim().length < 2) {
      throw new Error('Device name must be at least 2 characters long');
    }

    // Business rule: Secret is required and must be meaningful
    if (!deviceData.secret || deviceData.secret.trim() === '') {
      throw new Error('Device secret is required and cannot be empty');
    }

    // Business rule: Secret should be at least 6 characters long
    if (deviceData.secret.trim().length < 6) {
      throw new Error('Device secret must be at least 6 characters long');
    }

    // Business rule: Validate status if provided
    if (deviceData.status && !this.isValidStatus(deviceData.status)) {
      throw new Error('Invalid device status provided');
    }

    try {
      const device = await this.devicesRepository.create({
        name: deviceData.name.trim(),
        location: deviceData.location ? deviceData.location.trim() : null,
        status: deviceData.status || 'INACTIVE',
        secret: deviceData.secret.trim(),
      });

      return device;
    } catch {
      throw new Error('Failed to create device');
    }
  }

  /**
   * Update an existing device
   * @param id - The device ID to update
   * @param deviceData - The updated device data
   * @returns Promise<Device> The updated device
   * @throws Error if device not found or validation fails
   */
  async updateDevice(id: string, deviceData: UpdateDeviceDto): Promise<Device> {
    // Business rule: ID cannot be empty
    if (!id || id.trim() === '') {
      throw new Error('Device ID is required and cannot be empty');
    }

    // Business rule: At least one field must be provided for update
    if (!deviceData.name && !deviceData.location && !deviceData.status && !deviceData.secret) {
      throw new Error('At least one field must be provided for update');
    }

    // Check if device exists
    const existingDevice = await this.devicesRepository.findById(id);
    if (!existingDevice) {
      throw new Error(`Device with ID ${id} not found`);
    }

    // Business rule: Name validation if provided
    if (deviceData.name !== undefined) {
      if (!deviceData.name || deviceData.name.trim() === '') {
        throw new Error('Device name cannot be empty');
      }
      if (deviceData.name.trim().length < 2) {
        throw new Error('Device name must be at least 2 characters long');
      }
    }

    // Business rule: Status validation if provided
    if (deviceData.status && !this.isValidStatus(deviceData.status)) {
      throw new Error('Invalid device status provided');
    }

    // Business rule: Secret validation if provided
    if (deviceData.secret !== undefined) {
      if (!deviceData.secret || deviceData.secret.trim() === '') {
        throw new Error('Device secret cannot be empty');
      }
      if (deviceData.secret.trim().length < 6) {
        throw new Error('Device secret must be at least 6 characters long');
      }
    }

    try {
      const updateData: UpdateDeviceDto = {};

      if (deviceData.name !== undefined) {
        updateData.name = deviceData.name.trim();
      }
      if (deviceData.location !== undefined) {
        updateData.location = deviceData.location ? deviceData.location.trim() : null;
      }
      if (deviceData.status !== undefined) {
        updateData.status = deviceData.status;
      }
      if (deviceData.secret !== undefined) {
        updateData.secret = deviceData.secret.trim();
      }

      return await this.devicesRepository.update(id, updateData);
    } catch {
      throw new Error(`Failed to update device with ID: ${id}`);
    }
  }

  /**
   * Delete a device
   * @param id - The device ID to delete
   * @returns Promise<void>
   * @throws Error if device not found
   */
  async deleteDevice(id: string): Promise<void> {
    // Business rule: ID cannot be empty
    if (!id || id.trim() === '') {
      throw new Error('Device ID is required and cannot be empty');
    }

    // Check if device exists
    const existingDevice = await this.devicesRepository.findById(id);
    if (!existingDevice) {
      throw new Error(`Device with ID ${id} not found`);
    }

    try {
      await this.devicesRepository.delete(id);
    } catch {
      throw new Error(`Failed to delete device with ID: ${id}`);
    }
  }

  /**
   * Get device statistics
   * @returns Promise<object> Statistics about devices
   */
  async getDeviceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
  }> {
    try {
      const [total, active, inactive, error] = await Promise.all([
        this.devicesRepository.countByStatus(),
        this.devicesRepository.countByStatus('ACTIVE'),
        this.devicesRepository.countByStatus('INACTIVE'),
        this.devicesRepository.countByStatus('ERROR'),
      ]);

      return { total, active, inactive, error };
    } catch {
      throw new Error('Failed to retrieve device statistics');
    }
  }

  /**
   * Get the status of a specific device
   * @param id - The device ID
   * @returns The status of the device
   */
  async getDeviceStatus(id: string) {
    try {
      const status = await this.devicesRepository.getDeviceStatus(id);
      if (!status) {
        throw new Error(`Device with ID ${id} not found`);
      }
      return status;
    } catch {
      throw new Error('Failed to retrieve device status');
    }
  }

  /**
   * Private method to validate device status
   * @param status - The status to validate
   * @returns boolean True if valid, false otherwise
   */
  private isValidStatus(status: string): status is DeviceStatus {
    const validStatuses: DeviceStatus[] = ['INACTIVE', 'ACTIVE', 'ERROR'];
    return validStatuses.includes(status as DeviceStatus);
  }

  /**
   * Get the next command for a specific device
   * @param id - The device ID
   * @returns The next command for the device or null if none exists
   */
  async getNextCommandForDevice(id: string): Promise<CommandDto | null> {
    const queue = this.commandsQueue[id] || [];
    const cmd = queue.length > 0 ? queue.shift() : undefined;
    return cmd === undefined ? null : cmd;
  }

  /**
   * Queue a command for a specific device
   * @param id - The device ID
   * @param command - The command to queue
   */
  async queueCommandForDevice(id: string, command: CommandDto) {
    if (!this.commandsQueue[id]) this.commandsQueue[id] = [];
    this.logger.debug('Queueing command for device', { id, command });
    this.commandsQueue[id].push(command);
  }

  /**
   * Clear all queued commands for a specific device
   * @param id - The device ID
   */
  async clearCommandQueue(id: string): Promise<void> {
    if (this.commandsQueue[id]) {
      this.logger.info('Clearing command queue for device', { id });
      this.commandsQueue[id] = [];
    }
  }

  /**
   * Open a specific drawer for a device
   * @param id - The device ID
   * @param drawerNumber - The number of the drawer to open
   */
  async openDrawer(id: string, drawerNumber: number): Promise<void> {
    if (!this.commandsQueue[id]) this.commandsQueue[id] = [];
    const command: CommandDto = { action: 'open_drawer', drawer: drawerNumber };
    this.logger.debug('Queueing open drawer command for device', { id, command });
    this.commandsQueue[id].push(command);
  }

  /**
   * Store a confirmed command execution result for a device
   * device send a confirmation that a command was executed
   * @param id - The device ID
   * @param command - The command that was confirmed
   */
  async updateLastCommandExecution(id: string, command: string): Promise<void> {
    try {
      this.logger.info('Command confirmed by device', { id, command });
      if (!command) {
        throw new Error('No command provided for confirmation');
      }
      await this.devicesRepository.updateLastCommand(id);
    } catch {
      throw new Error(`Failed to confirm command for device with ID: ${id}`);
    }
  }

  /**
   * Update the last polling timestamp for a device
   * @param id - The device ID
   */
  async updateLastPoll(id: string): Promise<void> {
    try {
      this.logger.debug('Updating last poll timestamp for device', { id });
      await this.devicesRepository.updateLastPoll(id);
    } catch {
      throw new Error(`Failed to update last poll for device with ID: ${id}`);
    }
  }
}
