import { Request, Response } from 'express';
import { CommandsService } from '../../services/commands/CommandsService';
import Logger from '../../logger/logger';

/**
 * CommandsController
 *
 * Handles HTTP requests related to commands.
 * Routes requests to the appropriate service methods and formats responses.
 */
export class CommandsController {
  private commandsService: CommandsService;
  private logger = Logger.child({ component: 'CommandsController' });

  /**
   * Constructor - Injects the CommandsService dependency
   * @param commandsService - The service to handle business logic
   */
  constructor(commandsService: CommandsService) {
    this.commandsService = commandsService;
    this.logger.debug('CommandsController initialized');
  }

  /**
   * Get command status by code
   * GET /commands/:code
   */
  getCommandByCode = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.params;
    this.logger.info('GET /commands/:code called', { code });

    try {
      const command = await this.commandsService.getCommandByCode(code);

      if (!command) {
        this.logger.warn('Command not found', { code });
        res.status(404).json({
          error: 'Command not found',
          message: `No command found with code: ${code}`,
        });
        return;
      }

      this.logger.info('Command retrieved successfully', { code, status: command.status });
      res.status(200).json({
        id: command.id,
        code: command.code,
        deviceId: command.deviceId,
        action: command.action,
        drawer: command.drawer,
        status: command.status,
        createdAt: command.createdAt,
        executedAt: command.executedAt,
        failedAt: command.failedAt,
        errorMessage: command.errorMessage,
      });
    } catch (error) {
      this.logger.error('Error getting command by code', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve command',
      });
    }
  };

  /**
   * Mark command as executed
   * POST /commands/:code/execute
   */
  markCommandAsExecuted = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.params;
    this.logger.info('POST /commands/:code/execute called', { code });

    try {
      const command = await this.commandsService.markCommandAsExecuted(code);

      this.logger.info('Command marked as executed', { code });
      res.status(200).json({
        message: 'Command marked as executed successfully',
        command: {
          id: command.id,
          code: command.code,
          deviceId: command.deviceId,
          action: command.action,
          drawer: command.drawer,
          status: command.status,
          createdAt: command.createdAt,
          executedAt: command.executedAt,
        },
      });
    } catch (error) {
      this.logger.error('Error marking command as executed', {
        code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        res.status(404).json({
          error: 'Command not found',
          message: errorMessage,
        });
        return;
      }

      if (errorMessage.includes('not in PENDING')) {
        res.status(400).json({
          error: 'Invalid command status',
          message: errorMessage,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark command as executed',
      });
    }
  };

  /**
   * Mark command as failed
   * POST /commands/:code/fail
   */
  markCommandAsFailed = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.params;
    const { errorMessage } = req.body;
    this.logger.info('POST /commands/:code/fail called', { code, errorMessage });

    try {
      const command = await this.commandsService.markCommandAsFailed(code, errorMessage);

      this.logger.warn('Command marked as failed', { code, errorMessage });
      res.status(200).json({
        message: 'Command marked as failed',
        command: {
          id: command.id,
          code: command.code,
          deviceId: command.deviceId,
          action: command.action,
          drawer: command.drawer,
          status: command.status,
          createdAt: command.createdAt,
          failedAt: command.failedAt,
          errorMessage: command.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Error marking command as failed', {
        code,
        errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      if (errorMsg.includes('not found')) {
        res.status(404).json({
          error: 'Command not found',
          message: errorMsg,
        });
        return;
      }

      if (errorMsg.includes('not in PENDING')) {
        res.status(400).json({
          error: 'Invalid command status',
          message: errorMsg,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mark command as failed',
      });
    }
  };

  /**
   * Get all commands for a device
   * GET /commands/device/:deviceId
   */
  getCommandsByDevice = async (req: Request, res: Response): Promise<void> => {
    const { deviceId } = req.params;
    const { status } = req.query;
    this.logger.info('GET /commands/device/:deviceId called', { deviceId, status });

    try {
      const commands = await this.commandsService.getCommandsByDevice(deviceId, status as string | undefined);

      this.logger.info('Commands retrieved successfully', {
        deviceId,
        status,
        count: commands.length,
      });

      res.status(200).json({
        deviceId,
        status: status || 'all',
        count: commands.length,
        commands: commands.map((cmd) => ({
          id: cmd.id,
          code: cmd.code,
          action: cmd.action,
          drawer: cmd.drawer,
          status: cmd.status,
          createdAt: cmd.createdAt,
          executedAt: cmd.executedAt,
          failedAt: cmd.failedAt,
          errorMessage: cmd.errorMessage,
        })),
      });
    } catch (error) {
      this.logger.error('Error getting commands by device', {
        deviceId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Invalid status')) {
        res.status(400).json({
          error: 'Invalid status',
          message: errorMessage,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve commands',
      });
    }
  };

  /**
   * Get command statistics
   * GET /commands/stats or GET /commands/stats/:deviceId
   */
  getCommandStatistics = async (req: Request, res: Response): Promise<void> => {
    const { deviceId } = req.params;
    this.logger.info('GET /commands/stats called', { deviceId });

    try {
      const stats = await this.commandsService.getCommandStatistics(deviceId);

      this.logger.info('Command statistics retrieved', { deviceId, stats });
      res.status(200).json({
        deviceId: deviceId || 'all',
        statistics: stats,
      });
    } catch (error) {
      this.logger.error('Error getting command statistics', {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve command statistics',
      });
    }
  };
}
