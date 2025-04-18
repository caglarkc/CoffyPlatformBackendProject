/**
 * API Gateway Entry Point
 * Tüm mikroservisler için tek giriş noktası sağlar
 */

const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/admin-auth');
const userAuthRoutes = require('./routes/user-auth');
//const productRoutes = require('./routes/product');
//const storeRoutes = require('./routes/store');
const { logger } = require('../shared/utils/logger');
const services = require('./config/services');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load environment variables
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;

// Swagger yapılandırması
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coffy API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Coffy microservices',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development Gateway',
      },
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
          name: 'access_token'
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
    './routes/*.js',
    '../services/admin-auth-service/src/routes/*.js',
    '../services/**/src/routes/*.js'
  ],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Frontend origins
  credentials: true
}));
app.use(express.json());

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Gateway request: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Servis Durumu Endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    services: {
      'admin-service': services['admin-service'],
      'admin-auth-service': services['admin-auth-service'],
      'user-auth-service': services['user-auth-service'],
      'product-service': services['product-service'],
      'store-service': services['store-service'],
    },
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Tüm route'ları ekle
app.use('/api', adminRoutes);
app.use('/api', adminAuthRoutes);
app.use('/api', userAuthRoutes);
//app.use('/api', productRoutes);
//app.use('/api', storeRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn(`Gateway 404: ${req.method} ${req.url}`);
  res.status(404).json({
    status: 'error',
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Gateway Error:', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl
  });
  
  res.status(500).json({
    status: 'error',
    message: 'Internal Gateway Error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚪 API Gateway running on http://localhost:${PORT}`);
  logger.info(`📡 Proxy services: admin, admin-auth, user-auth, product, store`);
});

module.exports = app;
