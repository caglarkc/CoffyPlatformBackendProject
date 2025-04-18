const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const extractAdminIdMiddleware = require('../middlewares/extractAdminIdMiddleware');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

/**
 * @swagger
 * tags:
 *   name: Admin Service
 *   description: Admin Service endpoints
 */


/**
 * @swagger
 * /admin/me:
 *   get:
 *     summary: Get current admin profile
 *     tags: [Admin Service]
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
// GET /api/admin/me - Get current admin information
router.get('/me', extractAdminIdMiddleware, asyncHandler(AdminController.getMe));

/**
 * @swagger
 * /admin/change-data-many:
 *   post:
 *     summary: Update admin data many
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - surname
 *               - email
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 required: false
 *               surname:
 *                 type: string
 *                 required: false
 *               email:
 *                 type: string
 *                 format: email
 *                 required: false
 *               phone:
 *                 type: string
 *                 format: phone
 *                 required: false
 *     responses:
 *       200:
 *         description: Admin profile data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// PUT /api/admin/change-data-many - Update admin data many
router.post('/change-data-many', extractAdminIdMiddleware, asyncHandler(AdminController.changeAdminDataMany));

/**
 * @swagger
 * /admin/change-data-just-one:
 *   post:
 *     summary: Update admin data just one
 *     tags: [Admin Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// PUT /api/admin/change-data-just-one - Update admin data just one
router.post('/change-data-just-one', extractAdminIdMiddleware, asyncHandler(AdminController.changeAdminDataJustOne));

/**
 * @swagger
 * /admin/change-location:
 *   post:
 *     summary: Update admin location
 *     tags: [Admin Service]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// PUT /api/admin/change-location - Update admin location
router.post('/change-location', extractAdminIdMiddleware, asyncHandler(AdminController.changeLocation));

router.get('/delete-me', extractAdminIdMiddleware, asyncHandler(AdminController.deleteMe));

router.post('/downgrade-role', extractAdminIdMiddleware, asyncHandler(AdminController.downgradeRole));

router.post('/upgrade-role', extractAdminIdMiddleware, asyncHandler(AdminController.upgradeRole));

router.post('/block-admin', extractAdminIdMiddleware, asyncHandler(AdminController.blockAdmin));

router.post('/unblock-admin', extractAdminIdMiddleware, asyncHandler(AdminController.unblockAdmin));

router.post('/get-admin-with-id', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminWithId));

router.post('/get-admin-with-email', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminWithEmail));

router.post('/get-admin-with-phone', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminWithPhone));

router.get('/get-admins', extractAdminIdMiddleware, asyncHandler(AdminController.getAdmins));

router.post('/get-admins-with-unique-data', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminsWithUniqueData));

router.get('/get-users', extractAdminIdMiddleware, asyncHandler(AdminController.getUsers));



// POST /api/admin/clear-cookies - Tüm cookie'leri temizle
router.post('/clear-cookies', asyncHandler(AdminController.clearAllCookies));

// Test endpoint - auth servisi ile iletişimi test etmek için
router.post('/test-auth-communication', asyncHandler(AdminController.testAuthCommunication));


// Test endpoint - servisin çalışıp çalışmadığını kontrol etmek için
router.get('/test-service', asyncHandler(AdminController.testService));

module.exports = router;
