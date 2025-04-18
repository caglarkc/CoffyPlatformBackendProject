/**
 * API Gateway Entry Point
 * Tüm mikroservisler için tek giriş noktası sağlar
 */

const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/admin-auth');
const userAuthRoutes = require('./routes/user-auth');
const systemRoutes = require('./routes/system');
//const productRoutes = require('./routes/product');
//const storeRoutes = require('./routes/store');
const { logger } = require('../shared/utils/logger');
const services = require('./config/services');
const { specs, swaggerUi } = require('./config/swagger');

// Load environment variables
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.GATEWAY_PORT || 8080;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Frontend origins
  credentials: true
}));
app.use(express.json());

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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

// Health check endpoint - root level
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

// Tüm route'ları ekle
app.use('/api', adminRoutes);
app.use('/api', adminAuthRoutes);
app.use('/api', userAuthRoutes);
app.use('/api/system', systemRoutes);
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
