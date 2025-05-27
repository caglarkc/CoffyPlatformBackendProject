const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: User Authentication
 *   description: User registration, authentication, and profile management
 */

/**
 * @swagger
 * /api/v1/user-auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - password
 *               - name
 *               - surname
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "5551234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Passw0rd123"
 *                 description: "En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir"
 *               name:
 *                 type: string
 *                 example: "Ali"
 *                 description: "En az 3 karakter, en fazla 50 karakter olmalıdır"
 *               surname:
 *                 type: string
 *                 example: "Koçer"
 *                 description: "En az 3 karakter, en fazla 50 karakter olmalıdır"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email or phone already exists
 *       400:
 *         description: Invalid input data
 */
router.post('/register', asyncHandler(authController.register.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/send-verification-email:
 *   post:
 *     summary: Send verification email to user
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       403:
 *         description: Email already verified
 *       404:
 *         description: User not found
 */
router.post('/send-verification-email', asyncHandler(authController.sendVerificationEmail.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/verify-email:
 *   post:
 *     summary: Verify user's email with verification code
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: User not found
 */
router.post('/verify-email', asyncHandler(authController.verifyEmail.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/login-with-email-send-code:
 *   post:
 *     summary: Send login verification code to user's email
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       404:
 *         description: User not found
 */
router.post('/login-with-email-send-code', asyncHandler(authController.loginWithEmailSendCode.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/login-with-email-verify-code:
 *   post:
 *     summary: Verify login code sent to email
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
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
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired verification code
 *       404:
 *         description: User not found
 */
router.post('/login-with-email-verify-code', asyncHandler(authController.loginWithEmailVerifyCode.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/login-with-email-password:
 *   post:
 *     summary: Login with email and password
 *     tags: [User Authentication]
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
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post('/login-with-email-password', asyncHandler(authController.loginWithEmailPassword.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/login-with-phone-password:
 *   post:
 *     summary: Login with phone and password
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
router.post('/login-with-phone-password', asyncHandler(authController.loginWithPhonePassword.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/logout:
 *   get:
 *     summary: Logout current user
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to logout
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.get('/logout', asyncHandler(authController.logout.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/check-phone:
 *   get:
 *     summary: Check if phone number exists
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         required: true
 *         description: Phone number to check
 *     responses:
 *       200:
 *         description: Phone number availability status
 */
router.get('/check-phone', asyncHandler(authController.checkPhone.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/check-email:
 *   get:
 *     summary: Check if email exists
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Email to check
 *     responses:
 *       200:
 *         description: Email availability status
 */
router.get('/check-email', asyncHandler(authController.checkEmail.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/get-user:
 *   get:
 *     summary: Get current user profile
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *         example: "65f3a45d92d180d72a123456"
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Kullanıcı bilgileri başarıyla getirildi"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     surname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                     isActive:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get('/get-user', asyncHandler(authController.getUser.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/update-user:
 *   get:
 *     summary: Update user profile
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: "Kullanıcının ID'si"
 *         example: "65f3a45d92d180d72a123456"
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: "En az 3 karakter, en fazla 50 karakter olmalıdır. 'default' yazarak değişiklik yapmayabilirsiniz."
 *         example: "Ali"
 *       - in: query
 *         name: surname
 *         schema:
 *           type: string
 *         required: false
 *         description: "En az 3 karakter, en fazla 50 karakter olmalıdır. 'default' yazarak değişiklik yapmayabilirsiniz."
 *         example: "Koçer"
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         required: false
 *         description: "En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir. 'default' yazarak değişiklik yapmayabilirsiniz."
 *         example: "Passw0rd123"
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Şifre başarıyla güncellendi. İsim başarıyla güncellendi."
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     surname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.get('/update-user', asyncHandler(authController.updateUser.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/update-user-unique-request:
 *   get:
 *     summary: Request update for unique field (email or phone)
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *         example: "65f3a45d92d180d72a123456"
 *       - in: query
 *         name: data
 *         schema:
 *           type: string
 *         required: true
 *         description: New value for email or phone
 *         example: "yeni@example.com"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Field to update (email or phone)
 *         example: "email"
 *     responses:
 *       200:
 *         description: Update request sent successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.get('/update-user-unique-request', asyncHandler(authController.updateUserUniqueRequest.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/verify-update-request:
 *   get:
 *     summary: Verify update request for unique field
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *         example: "65f3a45d92d180d72a123456"
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification code
 *         example: "123456"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Field to update (email or phone)
 *         example: "email"
 *     responses:
 *       200:
 *         description: Update verified successfully
 *       400:
 *         description: Invalid code
 *       404:
 *         description: User or update request not found
 */
router.get('/verify-update-request', asyncHandler(authController.verifyUpdateRequest.bind(authController)));

/**
 * @swagger
 * /api/v1/user-auth/cancel-update-request:
 *   get:
 *     summary: Cancel an update request
 *     tags: [User Authentication]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *         example: "65f3a45d92d180d72a123456"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Field type (email or phone)
 *         example: "email"
 *     responses:
 *       200:
 *         description: Update request cancelled successfully
 *       404:
 *         description: User or update request not found
 */
router.get('/cancel-update-request', asyncHandler(authController.cancelUpdateRequest.bind(authController)));

// Admin-only route for manual key rotation
// This should be protected with admin authentication middleware in production
router.post('/admin/rotate-secret-key', async (req, res, next) => {
  try {
    // In production, add proper admin authentication middleware here
    const result = await keyRotationService.updateSecretKey();
    res.status(200).json({
      success: true,
      message: 'SECRET_KEY rotated successfully',
      timestamp: result.timestamp
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/user-auth/health:
 *   get:
 *     summary: Health check endpoint for User Auth Service
 *     description: Provides basic health status information for the User Auth Service
 *     tags: [User Authentication]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         
 */
router.get('/health', (req, res) => {
    res.status(200).json({ 
      message: 'OK',
      service: 'User Auth Service',
      timestamp: new Date().toISOString()
    });
});

module.exports = router;