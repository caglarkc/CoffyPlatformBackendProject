/**
 * Admin Auth Service Proxy Router
 * Admin auth servise gelen istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');
const { logger } = require('../../shared/utils/logger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Authentication
 *   description: Admin authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/v1/admin-auth:
 *   get:
 *     summary: Admin Auth Service routes
 *     description: All Admin Auth Service operations are proxied through this endpoint
 *     tags: [Admin Authentication]
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Add direct GET handler for /api/v1/admin-auth route to list all endpoints
router.get('/api/v1/admin-auth', (req, res) => {
  res.json({
    message: "Admin Auth Service API",
    version: "1.0.0",
    endpoints: [
      { path: "/api/v1/admin-auth/login", method: "POST", description: "Admin login" },
      { path: "/api/v1/admin-auth/check-phone", method: "GET", description: "Check if phone number exists" },
      { path: "/api/v1/admin-auth/check-email", method: "GET", description: "Check if email exists" },
      { path: "/api/v1/admin-auth/cookie-refresh", method: "GET", description: "Refresh auth token using cookie" },
      { path: "/api/v1/admin-auth/check-cookies", method: "GET", description: "Check auth cookies validity" },
      { path: "/api/v1/admin-auth/me", method: "GET", description: "Get current admin profile" },
      { path: "/api/v1/admin-auth/create-creator", method: "POST", description: "Create a creator account" },
      { path: "/api/v1/admin-auth/clear-cookies", method: "GET", description: "Clear all cookies" },
      { path: "/api/v1/admin-auth/clear-access-token", method: "GET", description: "Clear access token" },
      { path: "/api/v1/admin-auth/test-service", method: "GET", description: "Test endpoint to check service" },
      { path: "/api/v1/admin-auth/health", method: "GET", description: "Health check endpoint" },
      { path: "/api/v1/admin-auth/create-admin", method: "POST", description: "Create a new admin account" },
      { path: "/api/v1/admin-auth/logout", method: "GET", description: "Admin logout" },
      { path: "/api/v1/admin-auth/change-password", method: "POST", description: "Change admin password" }
    ]
  });
});


// Direct health check endpoint in API v1 format
router.get('/api/v1/admin-auth/health', (req, res) => {
  res.status(200).json({ 
    message: 'OK',
    service: 'Admin Auth Service',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});


// Admin Auth Service routes
router.use('/api/v1/admin-auth', createProxyMiddleware({
  target: services['admin-auth-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/admin-auth': '/api/v1/admin-auth' // Don't rewrite the path
  },
  // Timeout değerleri - çok kritik
  proxyTimeout: 60000, // 60 saniye
  timeout: 60000,      // 60 saniye
  
  // Response Body'yi handle et - Login responsu için önemli
  selfHandleResponse: false,
  
  // Auth bilgilerini aktarmak için cookie'leri koru
  cookieDomainRewrite: { '*': '' },
  
  // Hata ayıklama için loglar
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Admin Auth Proxy] ${req.method} ${req.url} -> ${services['admin-auth-service']}${proxyReq.path}`);
    
    // Body büyük mü kontrol et
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  
  // Hata ele alma
  onError: (err, req, res) => {
    logger.error(`[Admin Auth Proxy Error] ${err.message}`, { 
      error: err.message,
      stack: err.stack,
      url: req.url
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Admin Auth Service proxy error',
      error: err.message
    });
  },
  
  // Yanıt logları
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Admin Auth Proxy Response] ${req.method} ${req.url} Status: ${proxyRes.statusCode}`);
  }
}));


module.exports = router;
