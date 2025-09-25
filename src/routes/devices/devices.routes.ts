import { Router } from 'express';
import { DevicesController } from '../../controllers/devices/DevicesController';
import { devicesService } from '../../container';
import { authenticateDeviceJWT } from '../../middleware/deviceAuth';

/**
 * Devices Routes
 *
 * Defines all HTTP routes related to devices and sets up dependency injection.
 * This file follows the dependency injection pattern where:
 * Repository -> Service -> Controller -> Routes
 */

// Create router instance
const router = Router();

// Dependency injection setup via container
const devicesController = new DevicesController(devicesService);

/**
 * Device Routes with Swagger Documentation
 */

/**
 * @swagger
 * /devices/stats:
 *   get:
 *     summary: Get device statistics
 *     description: Retrieve aggregated statistics about all devices in the system
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: Device statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DeviceStats'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/stats', devicesController.getDeviceStats);

/**Public
 * @swagger
 * /devices:
 *   get:
 *     summary: Get all devices or filter by query parameters
 *     description: Retrieve all devices from the system, optionally filtered by status or location
 *     tags: [Devices]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ERROR]
 *         description: Filter devices by status
 *         example: ACTIVE
 *       - in: query
 *         name: location
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter devices by location
 *         example: Building A
 *     responses:
 *       200:
 *         description: Devices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *                 count:
 *                   type: integer
 *                   description: Number of devices returned
 *                   example: 5
 *                 filter:
 *                   type: object
 *                   description: Applied filters (if any)
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *                     location:
 *                       type: string
 *                       example: Building A
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', (req, res) => {
  const { status, location } = req.query;

  if (status) {
    return devicesController.getDevicesByStatus(req, res);
  }

  if (location) {
    return devicesController.getDevicesByLocation(req, res);
  }

  return devicesController.getAllDevices(req, res);
});

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     summary: Get a specific device by ID
 *     description: Retrieve a single device using its unique identifier
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: The device unique identifier
 *         example: clp123abc456def789
 *     responses:
 *       200:
 *         description: Device retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', devicesController.getDeviceById);

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Create a new device
 *     description: Create a new device in the system
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - secret
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: The device name
 *                 example: "Main Drawer Unit 01"
 *               location:
 *                 type: string
 *                 nullable: true
 *                 description: The device location
 *                 example: "Building A - Floor 2"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, ERROR]
 *                 description: The device status
 *                 example: "INACTIVE"
 *               secret:
 *                 type: string
 *                 minLength: 6
 *                 description: The device secret key for authentication
 *                 example: "abc123"
 *     responses:
 *       201:
 *         description: Device created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *                 message:
 *                   type: string
 *                   example: "Device created successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', devicesController.createDevice);

/**
 * @swagger
 * /devices/{id}:
 *   put:
 *     summary: Update an existing device
 *     description: Update an existing device's information. At least one field must be provided.
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: The device unique identifier
 *         example: clp123abc456def789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeviceDto'
 *           examples:
 *             full_update:
 *               summary: Update all fields
 *               value:
 *                 name: "Updated Drawer Unit"
 *                 location: "Building B - Floor 3"
 *                 status: "ACTIVE"
 *                 secret: "newsecret456"
 *             partial_update:
 *               summary: Update only status
 *               value:
 *                 status: "ERROR"
 *                 secret: "newsecret456"
 *             location_update:
 *               summary: Update location and name
 *               value:
 *                 name: "Relocated Drawer"
 *                 location: "New Building - Floor 1"
 *                 secret: "newsecret456"
 *             clear_location:
 *               summary: Clear location (set to null)
 *               value:
 *                 location: null
 *                 secret: null
 *     responses:
 *       200:
 *         description: Device updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Device'
 *                 message:
 *                   type: string
 *                   example: "Device updated successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', devicesController.updateDevice);

/**
 * @swagger
 * /devices/{id}:
 *   delete:
 *     summary: Delete a device
 *     description: Remove a device from the system permanently
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: The device unique identifier
 *         example: clp123abc456def789
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Device deleted successfully"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', devicesController.deleteDevice);

/**
 * @swagger
 * /devices/{id}/next-command:
 *   get:
 *     summary: Get the next command for a device
 *     description: Retrieve the next scheduled command for a specific device. Requires device authentication.
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: The device unique identifier
 *         example: clp123abc456def789
 *     responses:
 *       200:
 *         description: Next command retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Command'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
//router.get('/:id/next-command', verifyJWT, devicesController.getNextCommand);
router.get('/:id/next-command', authenticateDeviceJWT, devicesController.getNextCommand);

/**
 * @swagger
 * /devices/{id}/commands:
 *   post:
 *     summary: Create a new command for a device
 *     description: Schedule a new command to be executed by a specific device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: The device unique identifier
 *         example: clp123abc456def789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               command:
 *                 type: string
 *                 minLength: 1
 *                 description: The command to be executed
 *                 example: turn_on
 *             required:
 *               - command
 *           examples:
 *             example1:
 *               value:
 *                 command: turn_on
 *             example2:
 *               value:
 *                 command: turn_off
 *     responses:
 *       201:
 *         description: Command created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Command'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/commands', devicesController.queueCommand);

export default router;
