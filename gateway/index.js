/**
 * API Gateway Entry Point
 * Tüm mikroservisler için tek giriş noktası sağlar
 * Sadece yönlendirme işlevi var, ekstra middleware veya işlem içermiyor
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { getSpecs, swaggerSetup, swaggerUi } = require('./config/swagger');
const services = require('./config/services');
const { logger } = require('../shared/utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;

// CORS yapılandırması
app.use(cors({
  origin: '*', // Tüm kaynaklara izin ver (geliştirme sırasında)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Temel middleware'ler
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Swagger specs
(async () => {
  try {
    await getSpecs();
    logger.info('Swagger documentation initialized');
  } catch (error) {
    logger.error('Failed to initialize Swagger documentation', { error });
  }
})();

// Swagger UI setup with dynamic specs
app.use('/api-docs', swaggerSetup, swaggerUi.serve, swaggerUi.setup(null, {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Gateway is running' });
});

// System routes first
app.use('/api/system', require('./routes/system'));

// Log all requests to the gateway
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Debug configuration
logger.info('Gateway service configuration:');
Object.keys(services).forEach(service => {
  logger.info(`${service} -> ${services[service]}`);
});

// Admin Service proxy
app.use('/api/admin', createProxyMiddleware({
  target: services['admin-service'],
  pathRewrite: {
    '^/api/admin': '/admin'
  },
  changeOrigin: true
}));

// Admin Auth Service proxy
app.use('/api/admin-auth', createProxyMiddleware({
  target: services['admin-auth-service'],
  pathRewrite: {
    '^/api/admin-auth': '/admin-auth'
  },
  changeOrigin: true
}));

// User Auth Service proxy
app.use('/api/user/auth', createProxyMiddleware({
  target: services['user-auth-service'],
  pathRewrite: {
    '^/api/user/auth': '/auth'
  },
  changeOrigin: true
}));

// Product Service proxy
app.use('/api/product', createProxyMiddleware({
  target: services['product-service'],
  pathRewrite: {
    '^/api/product': '/product'
  },
  changeOrigin: true
}));

// Store Service proxy
app.use('/api/store', createProxyMiddleware({
  target: services['store-service'],
  pathRewrite: {
    '^/api/store': '/store'
  },
  changeOrigin: true
}));

// Default 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚪 API Gateway running on http://0.0.0.0:${PORT}`);
  logger.info(`📚 API Documentation: http://0.0.0.0:${PORT}/api-docs`);
});

module.exports = app; 