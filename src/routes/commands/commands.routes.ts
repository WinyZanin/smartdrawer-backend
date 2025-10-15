import { Router } from 'express';
import { CommandsController } from '../../controllers/commands/CommandsController';
import { commandsService } from '../../container';
import { authenticateApiKey } from '../../middleware/apiKeyAuth';
import { authenticateDeviceJWT } from '../../middleware/deviceAuth';

const router = Router();
const commandsController = new CommandsController(commandsService);

/**
 * @swagger
 * /commands/{code}:
 *   get:
 *     summary: Get command status by code
 *     description: Retrieve the status and details of a specific command using its unique code
 *     tags:
 *       - Commands
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique command code
 *         example: ABC123
 *     responses:
 *       200:
 *         description: Command retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "clxxx123456"
 *                 code:
 *                   type: string
 *                   example: "ABC123"
 *                 deviceId:
 *                   type: string
 *                   example: "device-001"
 *                 action:
 *                   type: string
 *                   example: "OPEN"
 *                 drawer:
 *                   type: number
 *                   nullable: true
 *                   example: 1
 *                 status:
 *                   type: string
 *                   enum: [PENDING, EXECUTED, FAILED]
 *                   example: "PENDING"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 executedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 failedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Command not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:code', authenticateApiKey, commandsController.getCommandByCode);

/**
 * @swagger
 * /commands/{code}/execute:
 *   post:
 *     summary: Mark command as executed
 *     description: Mark a command as successfully executed (typically called by ESP32 device)
 *     tags:
 *       - Commands
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique command code
 *         example: ABC123
 *     responses:
 *       200:
 *         description: Command marked as executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Command marked as executed successfully"
 *                 command:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     deviceId:
 *                       type: string
 *                     action:
 *                       type: string
 *                     drawer:
 *                       type: number
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       example: "EXECUTED"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     executedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid command status (command not in PENDING status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Command not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:code/execute', authenticateDeviceJWT, commandsController.markCommandAsExecuted);

/**
 * @swagger
 * /commands/{code}/fail:
 *   post:
 *     summary: Mark command as failed
 *     description: Mark a command as failed with an optional error message (typically called by ESP32 device)
 *     tags:
 *       - Commands
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique command code
 *         example: ABC123
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               errorMessage:
 *                 type: string
 *                 description: Optional error message describing the failure
 *                 example: "Motor timeout"
 *     responses:
 *       200:
 *         description: Command marked as failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Command marked as failed"
 *                 command:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     deviceId:
 *                       type: string
 *                     action:
 *                       type: string
 *                     drawer:
 *                       type: number
 *                       nullable: true
 *                     status:
 *                       type: string
 *                       example: "FAILED"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     failedAt:
 *                       type: string
 *                       format: date-time
 *                     errorMessage:
 *                       type: string
 *       400:
 *         description: Invalid command status (command not in PENDING status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Command not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:code/fail', authenticateDeviceJWT, commandsController.markCommandAsFailed);

/**
 * @swagger
 * /commands/device/{deviceId}:
 *   get:
 *     summary: Get all commands for a device
 *     description: Retrieve all commands for a specific device, with optional status filter
 *     tags:
 *       - Commands
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The device ID
 *         example: "device-001"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDING, EXECUTED, FAILED]
 *         description: Filter commands by status
 *         example: "PENDING"
 *     responses:
 *       200:
 *         description: Commands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deviceId:
 *                   type: string
 *                   example: "device-001"
 *                 status:
 *                   type: string
 *                   example: "PENDING"
 *                 count:
 *                   type: number
 *                   example: 5
 *                 commands:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       code:
 *                         type: string
 *                       action:
 *                         type: string
 *                       drawer:
 *                         type: number
 *                         nullable: true
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       executedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       failedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       errorMessage:
 *                         type: string
 *                         nullable: true
 *       400:
 *         description: Invalid status parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/device/:deviceId', authenticateApiKey, commandsController.getCommandsByDevice);

/**
 * @swagger
 * /commands/stats:
 *   get:
 *     summary: Get command statistics
 *     description: Get statistics for all commands (counts by status)
 *     tags:
 *       - Commands
 *     security:
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deviceId:
 *                   type: string
 *                   example: "all"
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: number
 *                       example: 5
 *                     executed:
 *                       type: number
 *                       example: 120
 *                     failed:
 *                       type: number
 *                       example: 3
 *                     total:
 *                       type: number
 *                       example: 128
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticateApiKey, commandsController.getCommandStatistics);

/**
 * @swagger
 * /commands/stats/{deviceId}:
 *   get:
 *     summary: Get command statistics for a device
 *     description: Get statistics for commands of a specific device (counts by status)
 *     tags:
 *       - Commands
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: The device ID
 *         example: "device-001"
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deviceId:
 *                   type: string
 *                   example: "device-001"
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: number
 *                       example: 2
 *                     executed:
 *                       type: number
 *                       example: 45
 *                     failed:
 *                       type: number
 *                       example: 1
 *                     total:
 *                       type: number
 *                       example: 48
 *       401:
 *         description: Unauthorized - Invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats/:deviceId', authenticateApiKey, commandsController.getCommandStatistics);

export default router;
