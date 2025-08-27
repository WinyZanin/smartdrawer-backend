import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API Health Check
 *     description: Check if the API is running and operational
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "SmartDrawer API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-01T12:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SmartDrawer API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
