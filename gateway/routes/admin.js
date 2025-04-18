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
 * /admin:
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

// Admin Service routes
router.use('/admin', createProxyMiddleware({
  target: services['admin-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': '/admin' // /api/admin -> /admin şeklinde yönlendir
  },
  // İstek ve yanıt logları
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Admin Proxy] ${req.method} ${req.url} -> ${services['admin-service']}${proxyReq.path}`);
  }
}));

module.exports = router;
