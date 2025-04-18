const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CoffyPlatform API Documentation',
      version: '1.0.0',
      description: 'Central API documentation for the CoffyPlatform microservice architecture',
    },
    servers: [
      {
        url: `http://localhost:8080/api`,
        description: 'Gateway API Endpoint'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken'
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      }
    ],
    tags: [
      {
        name: 'Admin Authentication',
        description: 'Admin authentication and authorization endpoints'
      },
      {
        name: 'User Authentication',
        description: 'User registration, authentication, and profile management'
      },
      {
        name: 'Admin Service',
        description: 'Admin service operations and management'
      },
      {
        name: 'Products',
        description: 'Product management operations'
      },
      {
        name: 'Stores',
        description: 'Store management operations'
      },
      {
        name: 'System',
        description: 'System operations and health checks'
      }
    ]
  },
  apis: [
    // Gateway routes
    path.join(__dirname, '../routes/*.js'),
    // Individual services
    // Note: We only include routes that are fully documented with JSDoc annotations
    path.join(__dirname, '../../services/admin-auth-service/src/routes/admin.auth.routes.js'),
    path.join(__dirname, '../../services/user-auth-service/src/routes/auth.routes.js'),
    path.join(__dirname, '../../services/admin-service/src/routes/admin.routes.js')
    // Add other services as they get documented
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
}; 