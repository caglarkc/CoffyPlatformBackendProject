/**
 * Admin Service Proxy Router
 * Admin servise gelen istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

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
