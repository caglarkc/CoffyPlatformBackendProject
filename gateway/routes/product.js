/**
 * Product Service Proxy Router
 * Ürün servisi için istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

router.use('/product', createProxyMiddleware({
  target: services['product-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/product': '/product'  // Product service gerçekte /api/store rotasını kullanıyor
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Product Proxy] ${req.method} ${req.url} -> ${services['product-service']}${proxyReq.path}`);
  }
}));

module.exports = router; 