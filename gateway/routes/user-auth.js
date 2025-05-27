/**
 * User Auth Service Proxy Router
 * User Auth servisine gelen istekleri yönlendirir
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User Authentication
 *   description: User registration, authentication, and profile management
 */

/**
 * @swagger
 * /api/v1/user-auth:
 *   get:
 *     summary: User Auth Service routes
 *     description: All User Auth Service operations are proxied through this endpoint
 *     tags: [User Authentication]
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Add direct GET handler for /api/v1/user-auth route to list all endpoints
router.get('/api/v1/user-auth', (req, res) => {
  res.json({
    message: "User Auth Service API",
    version: "1.0.0",
    endpoints: [
      { path: "/api/v1/user-auth/register", method: "POST", description: "Register a new user" },
      { path: "/api/v1/user-auth/send-verification-email", method: "POST", description: "Send verification email to user" },
      { path: "/api/v1/user-auth/verify-email", method: "POST", description: "Verify user's email with verification code" },
      { path: "/api/v1/user-auth/login-with-email-send-code", method: "POST", description: "Send login verification code to user's email" },
      { path: "/api/v1/user-auth/login-with-email-verify-code", method: "POST", description: "Verify login code sent to email" },
      { path: "/api/v1/user-auth/login-with-email-password", method: "POST", description: "Login with email and password" },
      { path: "/api/v1/user-auth/login-with-phone-send-code", method: "POST", description: "Send login verification code to user's phone" },
      { path: "/api/v1/user-auth/login-with-phone-verify-code", method: "POST", description: "Verify login code sent to phone" },
      { path: "/api/v1/user-auth/forgot-password", method: "POST", description: "Send password reset code" },
      { path: "/api/v1/user-auth/reset-password", method: "POST", description: "Reset password with verification code" },
      { path: "/api/v1/user-auth/change-password", method: "POST", description: "Change user password" },
      { path: "/api/v1/user-auth/logout", method: "GET", description: "User logout" },
      { path: "/api/v1/user-auth/me", method: "GET", description: "Get current user profile" },
      { path: "/api/v1/user-auth/health", method: "GET", description: "Health check endpoint" }
    ]
  });
});



// Direct health check endpoint in API v1 format
router.get('/api/v1/user-auth/health', (req, res) => {
  res.status(200).json({ 
    message: 'OK',
    service: 'User Auth Service',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});


// User Auth Service routes - new path
router.use('/api/v1/user-auth', createProxyMiddleware({
  target: services['user-auth-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/user-auth': '/api/v1/user-auth'  // /api/v1/user-auth -> /api/v1/user-auth şeklinde yönlendir
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[User Auth Proxy] ${req.method} ${req.url} -> ${services['user-auth-service']}${proxyReq.path}`);
  }
}));

module.exports = router;