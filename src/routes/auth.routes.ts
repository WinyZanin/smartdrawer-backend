import { Router } from 'express';
import { DeviceAuthController } from '../controllers/devices';

const router = Router();

const deviceAuthController = new DeviceAuthController();

/**
 * @swagger
 * /auth/device:
 *   post:
 *     summary: Authenticate a device
 *     description: Authenticate a device using device ID and secret to obtain a JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - secret
 *             properties:
 *               device_id:
 *                 type: string
 *                 description: The unique identifier of the device
 *               secret:
 *                 type: string
 *                 description: The secret key for device authentication
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated device
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Device ID and secret are required
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Credenciais inválidas
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   description: Error message details
 */
router.post('/device', deviceAuthController.authenticateDevice.bind(deviceAuthController));

export default router;
