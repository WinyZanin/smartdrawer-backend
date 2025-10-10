import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import Logger from '../logger/logger';

// Get server URLs from environment variables
const isDevelopment = process.env.NODE_ENV === 'development';
const devUrl = `${process.env.API_URL_DEV || 'http://localhost:3000'}/api/v1`;
const prodUrl = `${process.env.API_URL_PROD || 'https://api.smartdrawer.app'}/api/v1`;

// Configure servers based on environment - current environment first
const servers = isDevelopment
  ? [
      { url: devUrl, description: 'Development server (current)' },
      { url: prodUrl, description: 'Production server' },
    ]
  : [
      { url: prodUrl, description: 'Production server (current)' },
      { url: devUrl, description: 'Development server' },
    ];
/**
 * Swagger Configuration
 *
 * This file configures Swagger/OpenAPI documentation for the API.
 * It defines the basic API information and sets up the documentation generation.
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartDrawer API',
      version: '1.0.0',
      description: 'API for managing smart drawer devices and their operations',
      contact: {
        name: 'SmartDrawer Team',
        email: 'contact@smartdrawer.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers,
    tags: [
      {
        name: 'Devices',
        description: 'Device management operations',
      },
      {
        name: 'Health',
        description: 'API health check',
      },
      {
        name: 'Authentication',
        description: 'Device authentication operations',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for device authentication. Obtain token from /auth/device endpoint.',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for CRUD operations authentication. Contact system administrator to obtain API Key.',
        },
      },
      schemas: {
        Device: {
          type: 'object',
          required: ['id', 'name', 'status', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the device',
              example: 'clp123abc456def789',
            },
            name: {
              type: 'string',
              description: 'Human-readable name of the device',
              example: 'Main Drawer Unit 01',
            },
            location: {
              type: 'string',
              nullable: true,
              description: 'Physical location of the device',
              example: 'Building A - Floor 2 - Room 201',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'ERROR'],
              description: 'Current operational status of the device',
              example: 'ACTIVE',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the device was created',
              example: '2025-01-01T12:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the device was last updated',
              example: '2025-01-01T12:00:00.000Z',
            },
          },
        },
        CreateDeviceDto: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Name of the device',
              example: 'New Drawer Unit',
              minLength: 2,
            },
            location: {
              type: 'string',
              nullable: true,
              description: 'Location of the device',
              example: 'Building A - Floor 1',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'ERROR'],
              description: 'Initial status of the device',
              example: 'INACTIVE',
            },
          },
        },
        UpdateDeviceDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Updated name of the device',
              example: 'Updated Drawer Unit',
              minLength: 2,
            },
            location: {
              type: 'string',
              nullable: true,
              description: 'Updated location of the device',
              example: 'Building B - Floor 3',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'ERROR'],
              description: 'Updated status of the device',
              example: 'ACTIVE',
            },
          },
        },
        DeviceStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of devices',
              example: 15,
            },
            active: {
              type: 'integer',
              description: 'Number of active devices',
              example: 12,
            },
            inactive: {
              type: 'integer',
              description: 'Number of inactive devices',
              example: 2,
            },
            error: {
              type: 'integer',
              description: 'Number of devices with errors',
              example: 1,
            },
          },
        },
        DeviceStat: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier for the device status',
                  example: 'stat_123abc456def789',
                },
                deviceId: {
                  type: 'string',
                  description: 'ID of the associated device',
                  example: 'clp123abc456def789',
                },
                lastPoll: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp of the last device poll',
                  example: '2025-10-10T17:00:00.000Z',
                },
                lastCommand: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp of the last command sent to device',
                  example: '2025-10-10T16:55:00.000Z',
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp when the device status was created',
                  example: '2025-10-10T10:00:00.000Z',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Timestamp when the device status was last updated',
                  example: '2025-10-10T17:00:00.000Z',
                },
              },
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true,
            },
            data: {
              description: 'Response data (varies by endpoint)',
            },
            message: {
              type: 'string',
              description: 'Human-readable message',
              example: 'Operation completed successfully',
            },
            error: {
              type: 'string',
              description: 'Error message if success is false',
              example: 'Device not found',
            },
          },
        },
        Command: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the command',
              example: 'cmd_123abc456def789',
            },
            deviceId: {
              type: 'string',
              description: 'ID of the target device',
              example: 'clp123abc456def789',
            },
            command: {
              type: 'string',
              description: 'Command to be executed',
              example: 'turn_on',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'EXECUTED', 'FAILED'],
              description: 'Current status of the command',
              example: 'PENDING',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the command was created',
              example: '2025-09-08T23:45:00.000Z',
            },
            executedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Timestamp when the command was executed',
              example: '2025-09-08T23:46:00.000Z',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error category',
              example: 'Validation Error',
            },
            message: {
              type: 'string',
              description: 'Detailed error message',
              example: 'Device name is required and cannot be empty',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful',
              example: false,
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Unauthorized - Invalid or missing API key',
            },
            message: {
              type: 'string',
              description: 'Additional error details',
              example: 'Please provide a valid API key in the X-API-Key header',
            },
          },
        },
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Not Found',
                message: 'Device with ID clp123abc456def789 not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Validation Error',
                message: 'Device name is required and cannot be empty',
              },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing JWT token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Unauthorized',
                message: 'Invalid or missing authorization token',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API files
};

// Generate the Swagger specification
const specs = swaggerJsdoc(options);

// Logger configuration
const logger = Logger.child({ component: 'Swagger' });
/**
 * Setup Swagger documentation
 * @param app - Express application instance
 */
export const setupSwagger = (app: Application): void => {
  // Security check: do not setup Swagger in production
  if (process.env.NODE_ENV === 'production') {
    logger.warn('Swagger setup attempted in production environment - skipping for security');
    return;
  }

  // Swagger UI setup
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SmartDrawer API Documentation',
    }),
  );

  // JSON spec endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  logger.debug('Swagger documentation available at: http://localhost:3000/api-docs');
};

export default specs;
