/**
 * System Routes
 * Health check, status monitoring, and system info endpoints
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const services = require('../config/services');
const { logger } = require('../../shared/utils/logger');
const axios = require('axios'); // Use axios instead of fetch for broader compatibility
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System operations, health checks, and monitoring
 */

/**
 * @swagger
 * /system/health:
 *   get:
 *     summary: Check API Gateway health
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Gateway is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: API Gateway is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'API Gateway is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /system/status:
 *   get:
 *     summary: Check all services status
 *     description: Get status information for all microservices
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Status of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 services:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                     example: http://localhost:3001
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    services: services,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /system/time:
 *   get:
 *     summary: Get server time
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Current server time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 time:
 *                   type: string
 *                   format: date-time
 *                 timezone:
 *                   type: string
 *                   example: UTC
 */
router.get('/time', (req, res) => {
  const now = new Date();
  res.status(200).json({
    time: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
});

/**
 * @swagger
 * /system/info:
 *   get:
 *     summary: Get system information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 platform:
 *                   type: string
 *                   example: node
 *                 version:
 *                   type: string
 *                   example: v14.17.0
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                     heapTotal:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                 uptime:
 *                   type: number
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    platform: process.platform,
    version: process.version,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * /system/services:
 *   get:
 *     summary: Get health status of all services
 *     description: Check health status of all available microservices
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Health status of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded, error]
 *                   example: ok
 *                 services:
 *                   type: object
 *                   properties:
 *                     admin_auth:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [ok, error]
 *                           example: ok
 *                         message:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 *                           example: 42
 *                     user_auth:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [ok, error]
 *                           example: ok
 *                         message:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                           description: Response time in milliseconds
 *                           example: 37
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/services', async (req, res) => {
  try {
    // Tüm servislerin sağlık durumunu kontrol et
    const serviceStatus = {
      status: 'ok',
      services: {},
      timestamp: new Date().toISOString()
    };
    
    // Admin Auth servis kontrolü
    try {
      const startTime = Date.now();
      const adminAuthResponse = await axios.get(`${services['admin-auth-service']}/admin-auth/health`, {
        timeout: 3000 // 3 saniye timeout
      });
      const responseTime = Date.now() - startTime;
      
      serviceStatus.services.admin_auth = { 
        status: 'ok',
        responseTime,
        message: adminAuthResponse.data?.message || 'Service is healthy'
      };
    } catch (error) {
      serviceStatus.services.admin_auth = { 
        status: 'error',
        message: error.message || 'Could not connect to service'
      };
    }
    
    // User Auth servis kontrolü
    try {
      const startTime = Date.now();
      const userAuthResponse = await axios.get(`${services['user-auth-service']}/auth/health`, {
        timeout: 3000 // 3 saniye timeout
      });
      const responseTime = Date.now() - startTime;
      
      serviceStatus.services.user_auth = { 
        status: 'ok',
        responseTime,
        message: userAuthResponse.data?.message || 'Service is healthy'
      };
    } catch (error) {
      serviceStatus.services.user_auth = { 
        status: 'error',
        message: error.message || 'Could not connect to service'
      };
    }
    
    // Tüm servislerin durumunu kontrol et ve genel durumu belirle
    const serviceStatuses = Object.values(serviceStatus.services).map(s => s.status);
    const errorCount = serviceStatuses.filter(s => s === 'error').length;
    
    if (errorCount === serviceStatuses.length) {
      serviceStatus.status = 'error'; // Tüm servisler hatalıysa
    } else if (errorCount > 0) {
      serviceStatus.status = 'degraded'; // Bazı servisler hatalıysa
    }
    
    res.status(200).json(serviceStatus);
  } catch (error) {
    logger.error('Error checking service health', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to check service health',
      error: error.message
    });
  }
});

module.exports = router; 