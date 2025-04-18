const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Admin Service API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Admin Service',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Admin Service (Direct)'
      },
      {
        url: 'http://localhost:8080/api',
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
    ]
  },
  apis: [
    path.join(__dirname, '../routes/admin.routes.js')
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
}; 