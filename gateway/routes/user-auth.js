/**
 * User Auth Service Proxy Router
 * User Auth servisine gelen istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();


// User Auth Service routes
router.use('/user/auth', createProxyMiddleware({
  target: services['user-auth-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/user/auth': '/auth'  // /api/user/auth -> /auth şeklinde yönlendir
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[User Auth Proxy] ${req.method} ${req.url} -> ${services['user-auth-service']}${proxyReq.path}`);
  }
}));

module.exports = router; 