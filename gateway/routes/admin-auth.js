/**
 * Admin Auth Service Proxy Router
 * Admin auth servise gelen istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');
const { logger } = require('../../shared/utils/logger');

const router = express.Router();

// Admin Auth Service routes
router.use('/admin-auth', createProxyMiddleware({
  target: services['admin-auth-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin-auth': '/admin-auth' // /api/admin-auth -> /admin-auth şeklinde yönlendir
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
