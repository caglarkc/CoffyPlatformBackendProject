const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/admin.auth.controller');
const { authAdminMiddleware } = require('../middlewares/adminMiddleware');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Admin Authentication
 *   description: Admin authentication and authorization endpoints
 */

/**
 * @swagger
 * /api/v1/admin-auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 admin:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', asyncHandler(AdminAuthController.loginAdmin));

/**
 * @swagger
 * /api/v1/admin-auth/check-phone:
 *   get:
 *     summary: Check if phone number exists
 *     tags: [Admin Authentication]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone number to check
 *     responses:
 *       200:
 *         description: Check successful
 *       404:
 *         description: Phone not found
 *       500:
 *         description: Server error
 */
router.get('/check-phone', asyncHandler(AdminAuthController.checkPhone));

/**
 * @swagger
 * /api/v1/admin-auth/check-email:
 *   get:
 *     summary: Check if email exists
 *     tags: [Admin Authentication]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email to check
 *     responses:
 *       200:
 *         description: Check successful
 *       404:
 *         description: Email not found
 *       500:
 *         description: Server error
 */
router.get('/check-email', asyncHandler(AdminAuthController.checkEmail));

// Açık rotalar - kimlik doğrulama gerektirmez
router.get('/cookie-refresh', asyncHandler(AdminAuthController.cookieRefreshToken));
router.get('/check-cookies', asyncHandler(AdminAuthController.checkCookie));

/**
 * @swagger
 * /api/v1/admin-auth/me:
 *   get:
 *     summary: Get current admin profile
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', authAdminMiddleware, asyncHandler(AdminAuthController.getAdmin));




router.post('/create-creator', asyncHandler(AdminAuthController.createCreator));
router.get('/clear-cookies', asyncHandler(AdminAuthController.clearAllCookies));
router.get('/clear-access-token', asyncHandler(AdminAuthController.clearAccessToken));

// Test endpoint - servisin çalışıp çalışmadığını kontrol etmek için
router.get('/test-service', asyncHandler(AdminAuthController.testService));

/**
 * @swagger
 * /api/v1/admin-auth/health:
 *   get:
 *     summary: Health check endpoint for Admin Auth Service
 *     description: Provides basic health status information for the Admin Auth Service
 *     tags: [Admin Authentication]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/health', (req, res) => {
    res.status(200).json({ 
      message: 'OK',
      service: 'Admin Auth Service',
      timestamp: new Date().toISOString()
    });
});

// Korumalı rotalar - kimlik doğrulama gerektirir
router.post('/create-admin', authAdminMiddleware,asyncHandler(AdminAuthController.createAdmin));
router.post('/create-admin-with-store', authAdminMiddleware,asyncHandler(AdminAuthController.createAdminWithStore));
router.get('/logout', authAdminMiddleware, asyncHandler(AdminAuthController.logoutAdmin));
router.post('/change-password', authAdminMiddleware, asyncHandler(AdminAuthController.changePassword));


module.exports = router;
