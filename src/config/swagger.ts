import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import Logger from '../logger/logger';
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
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.smartdrawer.app/v1',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Devices',
        description: 'Device management operations',
      },
      {
        name: 'Health',
        description: 'API health check',
      },
    ],
    components: {
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

/**
 * Setup Swagger documentation
 * @param app - Express application instance
 */
export const setupSwagger = (app: Application): void => {
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

  Logger.debug('Swagger documentation available at: http://localhost:3000/api-docs');
};

export default specs;
