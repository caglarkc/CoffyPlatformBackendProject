/**
 * Store Service Proxy Router
 * Mağaza servisi için istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

router.use('/store', createProxyMiddleware({
  target: services['store-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/store': '/api/store'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Store Proxy] ${req.method} ${req.url} -> ${services['store-service']}${proxyReq.path}`);
  }
}));

module.exports = router; 