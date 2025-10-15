import prisma from '../../db/prisma';
import Logger from '../../logger/logger';

export interface CreateCommandDto {
  deviceId: string;
  action: string;
  drawer?: number;
}

export interface Command {
  id: string;
  deviceId: string;
  code: string;
  action: string;
  drawer: number | null;
  status: string;
  createdAt: Date;
  executedAt: Date | null;
  failedAt: Date | null;
  errorMessage: string | null;
}

/**
 * CommandsRepository
 *
 * Handles all database operations related to commands.
 */
export class CommandsRepository {
  private logger = Logger.child({ component: 'CommandsRepository' });

  /**
   * Create a new command
   * @param data - Command data
   * @returns Promise<Command> The created command
   */
  async create(data: CreateCommandDto): Promise<Command> {
    this.logger.debug('Creating new command', {
      deviceId: data.deviceId,
      action: data.action,
      drawer: data.drawer,
    });

    try {
      const command = await prisma.command.create({
        data: {
          deviceId: data.deviceId,
          action: data.action,
          drawer: data.drawer || null,
          status: 'PENDING',
        },
      });

      this.logger.info('Command created successfully', {
        commandId: command.id,
        code: command.code,
        deviceId: command.deviceId,
      });

      return command;
    } catch (error) {
      this.logger.error('Error creating command', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });
      throw error;
    }
  }

  /**
   * Find command by code
   * @param code - Command code
   * @returns Promise<Command | null>
   */
  async findByCode(code: string): Promise<Command | null> {
    this.logger.debug('Finding command by code', { code });

    try {
      const command = await prisma.command.findUnique({
        where: { code },
      });

      this.logger.debug(`Command ${command ? 'found' : 'not found'}`, { code });
      return command;
    } catch (error) {
      this.logger.error('Error finding command by code', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Find next pending command for a device
   * @param deviceId - Device ID
   * @returns Promise<Command | null>
   */
  async findNextPending(deviceId: string): Promise<Command | null> {
    this.logger.debug('Finding next pending command', { deviceId });

    try {
      const command = await prisma.command.findFirst({
        where: {
          deviceId,
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (command) {
        this.logger.info('Found pending command', {
          commandId: command.id,
          code: command.code,
          deviceId,
        });
      } else {
        this.logger.debug('No pending commands found', { deviceId });
      }

      return command;
    } catch (error) {
      this.logger.error('Error finding next pending command', {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Mark command as executed
   * @param code - Command code
   * @returns Promise<Command>
   */
  async markAsExecuted(code: string): Promise<Command> {
    this.logger.info('Marking command as executed', { code });

    try {
      const command = await prisma.command.update({
        where: { code },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
        },
      });

      this.logger.info('Command marked as executed', {
        commandId: command.id,
        code: command.code,
      });

      return command;
    } catch (error) {
      this.logger.error('Error marking command as executed', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Mark command as failed
   * @param code - Command code
   * @param errorMessage - Error message
   * @returns Promise<Command>
   */
  async markAsFailed(code: string, errorMessage?: string): Promise<Command> {
    this.logger.warn('Marking command as failed', { code, errorMessage });

    try {
      const command = await prisma.command.update({
        where: { code },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: errorMessage || 'Command execution failed',
        },
      });

      this.logger.warn('Command marked as failed', {
        commandId: command.id,
        code: command.code,
        errorMessage,
      });

      return command;
    } catch (error) {
      this.logger.error('Error marking command as failed', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get all commands for a device
   * @param deviceId - Device ID
   * @param status - Optional status filter
   * @returns Promise<Command[]>
   */
  async findByDevice(deviceId: string, status?: string): Promise<Command[]> {
    this.logger.debug('Finding commands by device', { deviceId, status });

    try {
      const commands = await prisma.command.findMany({
        where: {
          deviceId,
          ...(status && { status }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.debug(`Found ${commands.length} commands`, { deviceId, status });
      return commands;
    } catch (error) {
      this.logger.error('Error finding commands by device', {
        deviceId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Count commands by status
   * @param deviceId - Optional device ID filter
   * @param status - Optional status filter
   * @returns Promise<number>
   */
  async count(deviceId?: string, status?: string): Promise<number> {
    try {
      return await prisma.command.count({
        where: {
          ...(deviceId && { deviceId }),
          ...(status && { status }),
        },
      });
    } catch (error) {
      this.logger.error('Error counting commands', {
        deviceId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete old commands
   * @param olderThanDays - Delete commands older than X days
   * @returns Promise<number> Number of deleted commands
   */
  async deleteOld(olderThanDays: number = 30): Promise<number> {
    this.logger.info('Deleting old commands', { olderThanDays });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.command.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          status: {
            in: ['EXECUTED', 'FAILED'],
          },
        },
      });

      this.logger.info('Old commands deleted', {
        count: result.count,
        olderThanDays,
      });

      return result.count;
    } catch (error) {
      this.logger.error('Error deleting old commands', {
        olderThanDays,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
