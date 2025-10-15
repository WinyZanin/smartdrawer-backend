import { CommandsRepository, CreateCommandDto, Command } from '../../repositories/commands/CommandsRepository';
import Logger from '../../logger/logger';

/**
 * CommandsService
 *
 * Contains all business logic related to commands.
 * Manages the command lifecycle from creation to execution/failure.
 */
export class CommandsService {
  private commandsRepository: CommandsRepository;
  private logger = Logger.child({ component: 'CommandsService' });

  /**
   * Constructor - Injects the CommandsRepository dependency
   * @param commandsRepository - The repository to handle data operations
   */
  constructor(commandsRepository: CommandsRepository) {
    this.commandsRepository = commandsRepository;
    this.logger.debug('CommandsService initialized');
  }

  /**
   * Create a new command for a device
   * @param data - Command data (deviceId, action, drawer)
   * @returns Promise<Command> The created command with unique code
   */
  async createCommand(data: CreateCommandDto): Promise<Command> {
    // Validate deviceId
    if (!data.deviceId || data.deviceId.trim() === '') {
      throw new Error('Device ID is required');
    }

    // Validate action
    if (!data.action || data.action.trim() === '') {
      throw new Error('Action is required');
    }

    const validActions = ['OPEN', 'CLOSE', 'UNLOCK', 'LOCK'];
    if (!validActions.includes(data.action.toUpperCase())) {
      throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    }

    // Validate drawer if provided
    if (data.drawer !== undefined) {
      if (!Number.isInteger(data.drawer) || data.drawer < 1 || data.drawer > 10) {
        throw new Error('Drawer must be an integer between 1 and 10');
      }
    }

    try {
      const command = await this.commandsRepository.create({
        deviceId: data.deviceId.trim(),
        action: data.action.toUpperCase(),
        drawer: data.drawer,
      });

      this.logger.info('Command created successfully', {
        commandId: command.id,
        code: command.code,
        deviceId: command.deviceId,
        action: command.action,
      });

      return command;
    } catch (error) {
      this.logger.error('Failed to create command', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw new Error('Failed to create command');
    }
  }

  /**
   * Get command by code
   * @param code - The unique command code
   * @returns Promise<Command | null>
   */
  async getCommandByCode(code: string): Promise<Command | null> {
    if (!code || code.trim() === '') {
      throw new Error('Command code is required');
    }

    try {
      return await this.commandsRepository.findByCode(code.trim());
    } catch (error) {
      this.logger.error('Failed to get command by code', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
      });
      throw new Error('Failed to retrieve command');
    }
  }

  /**
   * Get the next pending command for a device
   * @param deviceId - The device ID
   * @returns Promise<Command | null>
   */
  async getNextPendingCommand(deviceId: string): Promise<Command | null> {
    if (!deviceId || deviceId.trim() === '') {
      throw new Error('Device ID is required');
    }

    try {
      return await this.commandsRepository.findNextPending(deviceId.trim());
    } catch (error) {
      this.logger.error('Failed to get next pending command', {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceId,
      });
      throw new Error('Failed to retrieve next pending command');
    }
  }

  /**
   * Mark a command as successfully executed
   * @param code - The command code
   * @returns Promise<Command>
   */
  async markCommandAsExecuted(code: string): Promise<Command> {
    if (!code || code.trim() === '') {
      throw new Error('Command code is required');
    }

    try {
      // Verify command exists and is in PENDING status
      const command = await this.commandsRepository.findByCode(code.trim());

      if (!command) {
        throw new Error(`Command with code ${code} not found`);
      }

      if (command.status !== 'PENDING') {
        throw new Error(`Command with code ${code} is not in PENDING status (current: ${command.status})`);
      }

      return await this.commandsRepository.markAsExecuted(code.trim());
    } catch (error) {
      this.logger.error('Failed to mark command as executed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
      });

      // Re-throw with original message if it's our custom error
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not in PENDING'))) {
        throw error;
      }

      throw new Error('Failed to mark command as executed');
    }
  }

  /**
   * Mark a command as failed
   * @param code - The command code
   * @param errorMessage - Optional error message
   * @returns Promise<Command>
   */
  async markCommandAsFailed(code: string, errorMessage?: string): Promise<Command> {
    if (!code || code.trim() === '') {
      throw new Error('Command code is required');
    }

    try {
      // Verify command exists and is in PENDING status
      const command = await this.commandsRepository.findByCode(code.trim());

      if (!command) {
        throw new Error(`Command with code ${code} not found`);
      }

      if (command.status !== 'PENDING') {
        throw new Error(`Command with code ${code} is not in PENDING status (current: ${command.status})`);
      }

      return await this.commandsRepository.markAsFailed(code.trim(), errorMessage?.trim());
    } catch (error) {
      this.logger.error('Failed to mark command as failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        errorMessage,
      });

      // Re-throw with original message if it's our custom error
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('not in PENDING'))) {
        throw error;
      }

      throw new Error('Failed to mark command as failed');
    }
  }

  /**
   * Get all commands for a device
   * @param deviceId - The device ID
   * @param status - Optional status filter (PENDING, EXECUTED, FAILED)
   * @returns Promise<Command[]>
   */
  async getCommandsByDevice(deviceId: string, status?: string): Promise<Command[]> {
    if (!deviceId || deviceId.trim() === '') {
      throw new Error('Device ID is required');
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'EXECUTED', 'FAILED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    try {
      return await this.commandsRepository.findByDevice(deviceId.trim(), status?.toUpperCase());
    } catch (error) {
      this.logger.error('Failed to get commands by device', {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceId,
        status,
      });
      throw new Error('Failed to retrieve commands');
    }
  }

  /**
   * Get command statistics
   * @param deviceId - Optional device ID filter
   * @returns Promise with counts for each status
   */
  async getCommandStatistics(deviceId?: string): Promise<{
    pending: number;
    executed: number;
    failed: number;
    total: number;
  }> {
    try {
      const [pending, executed, failed, total] = await Promise.all([
        this.commandsRepository.count(deviceId, 'PENDING'),
        this.commandsRepository.count(deviceId, 'EXECUTED'),
        this.commandsRepository.count(deviceId, 'FAILED'),
        this.commandsRepository.count(deviceId),
      ]);

      return { pending, executed, failed, total };
    } catch (error) {
      this.logger.error('Failed to get command statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        deviceId,
      });
      throw new Error('Failed to retrieve command statistics');
    }
  }

  /**
   * Delete old completed commands
   * @param olderThanDays - Delete commands older than X days (default: 30)
   * @returns Promise<number> Number of deleted commands
   */
  async cleanupOldCommands(olderThanDays: number = 30): Promise<number> {
    if (olderThanDays < 1) {
      throw new Error('olderThanDays must be at least 1');
    }

    try {
      const deletedCount = await this.commandsRepository.deleteOld(olderThanDays);

      this.logger.info('Old commands cleaned up', {
        deletedCount,
        olderThanDays,
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup old commands', {
        error: error instanceof Error ? error.message : 'Unknown error',
        olderThanDays,
      });
      throw new Error('Failed to cleanup old commands');
    }
  }
}
