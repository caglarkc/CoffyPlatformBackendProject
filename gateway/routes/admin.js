/**
 * Admin Service Proxy Router
 * Admin servise gelen istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Service
 *   description: Admin Service operations and management
 */

/**
 * @swagger
 * /api/v1/admin:
 *   get:
 *     summary: Admin Service routes
 *     description: All Admin Service operations are proxied through this endpoint
 *     tags: [Admin Service]
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Add direct GET handler for /api/v1/admin route
router.get('/api/v1/admin', (req, res) => {
  res.json({
    message: "Admin Service API",
    version: "1.0.0",
    endpoints: [
      { path: "/api/v1/admin/me", method: "GET", description: "Get current admin profile" },
      { path: "/api/v1/admin/change-data-many", method: "POST", description: "Update admin data many" },
      { path: "/api/v1/admin/change-data-just-one", method: "POST", description: "Update a single field of admin data" },
      { path: "/api/v1/admin/change-location", method: "POST", description: "Update admin location" },
      { path: "/api/v1/admin/delete-me", method: "GET", description: "Delete current admin account" },
      { path: "/api/v1/admin/downgrade-role", method: "POST", description: "Downgrade admin role" },
      { path: "/api/v1/admin/upgrade-role", method: "POST", description: "Upgrade admin role" },
      { path: "/api/v1/admin/block-admin", method: "POST", description: "Block an admin" },
      { path: "/api/v1/admin/unblock-admin", method: "POST", description: "Unblock an admin" },
      { path: "/api/v1/admin/get-admin-with-id", method: "POST", description: "Get admin by ID" },
      { path: "/api/v1/admin/get-admin-with-email", method: "POST", description: "Get admin by email" },
      { path: "/api/v1/admin/get-admin-with-phone", method: "POST", description: "Get admin by phone" },
      { path: "/api/v1/admin/get-admins", method: "GET", description: "Get all admins" },
      { path: "/api/v1/admin/get-admins-with-unique-data", method: "POST", description: "Get admins with unique data" },
      { path: "/api/v1/admin/get-users", method: "GET", description: "Get all users" },
      { path: "/api/v1/admin/clear-cookies", method: "POST", description: "Clear all cookies" },
      { path: "/api/v1/admin/test-auth-communication", method: "POST", description: "Test communication with auth service" },
      { path: "/api/v1/admin/test-service", method: "GET", description: "Test admin service operation" },
      { path: "/api/v1/admin/health", method: "GET", description: "Health check endpoint" }
    ]
  });
});


// Direct health check endpoint in API v1 format
router.get('/api/v1/admin/health', (req, res) => {
  res.status(200).json({ 
    message: 'OK',
    service: 'Admin Service',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

// Admin Service routes - new path
router.use('/api/v1/admin', createProxyMiddleware({
  target: services['admin-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/admin': '/api/v1/admin' // Don't rewrite the path
  },
  // İstek ve yanıt logları
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Admin Proxy] ${req.method} ${req.url} -> ${services['admin-service']}${proxyReq.path}`);
  }
}));


module.exports = router;
