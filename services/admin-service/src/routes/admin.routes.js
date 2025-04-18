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
 *     summary: Update a single field of admin data
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newData
 *               - type
 *             properties:
 *               newData:
 *                 type: string
 *                 description: "New value to update"
 *                 example: "example@mail.com"
 *               type:
 *                 type: string
 *                 description: "Field to update (name, surname, email, phone)"
 *                 example: "email"
 *     responses:
 *       200:
 *         description: Admin data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Admin bilgileri başarıyla güncellendi"
 *                 data:
 *                   type: object
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *             properties:
 *               location:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: "Istanbul"
 *                   district:
 *                     type: string
 *                     example: "Kadıköy"
 *                   region:
 *                     type: string
 *                     example: "Marmara"
 *                   storeId:
 *                     type: string
 *                     example: "1234"
 *     responses:
 *       200:
 *         description: Admin location updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// PUT /api/admin/change-location - Update admin location
router.post('/change-location', extractAdminIdMiddleware, asyncHandler(AdminController.changeLocation));

/**
 * @swagger
 * /admin/delete-me:
 *   get:
 *     summary: Delete current admin account
 *     tags: [Admin Service]
 *     responses:
 *       200:
 *         description: Admin account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/delete-me', extractAdminIdMiddleware, asyncHandler(AdminController.deleteMe));

/**
 * @swagger
 * /admin/downgrade-role:
 *   post:
 *     summary: Downgrade admin role
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: "Admin ID to downgrade role"
 *                 example: "65f3a45d92d180d72a123456"
 *     responses:
 *       200:
 *         description: Admin role downgraded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/downgrade-role', extractAdminIdMiddleware, asyncHandler(AdminController.downgradeRole));

/**
 * @swagger
 * /admin/upgrade-role:
 *   post:
 *     summary: Upgrade admin role
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: "Admin ID to upgrade role"
 *                 example: "65f3a45d92d180d72a123456"
 *     responses:
 *       200:
 *         description: Admin role upgraded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/upgrade-role', extractAdminIdMiddleware, asyncHandler(AdminController.upgradeRole));

/**
 * @swagger
 * /admin/block-admin:
 *   post:
 *     summary: Block an admin
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: "Admin ID to block"
 *                 example: "65f3a45d92d180d72a123456"
 *     responses:
 *       200:
 *         description: Admin blocked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/block-admin', extractAdminIdMiddleware, asyncHandler(AdminController.blockAdmin));

/**
 * @swagger
 * /admin/unblock-admin:
 *   post:
 *     summary: Unblock an admin
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: "Admin ID to unblock"
 *                 example: "65f3a45d92d180d72a123456"
 *     responses:
 *       200:
 *         description: Admin unblocked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.post('/unblock-admin', extractAdminIdMiddleware, asyncHandler(AdminController.unblockAdmin));

/**
 * @swagger
 * /admin/get-admin-with-id:
 *   post:
 *     summary: Get admin by ID
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: "ID of the admin to retrieve"
 *                 example: "65f3a45d92d180d72a123456"
 *     responses:
 *       200:
 *         description: Admin found
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post('/get-admin-with-id', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminWithId));

/**
 * @swagger
 * /admin/get-admin-with-email:
 *   post:
 *     summary: Get admin by email
 *     tags: [Admin Service]
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
 *                 description: "Email of the admin to retrieve"
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Admin found
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post('/get-admin-with-email', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminWithEmail));

/**
 * @swagger
 * /admin/get-admin-with-phone:
 *   post:
 *     summary: Get admin by phone
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: "Phone number of the admin to retrieve"
 *                 example: "5551234567"
 *     responses:
 *       200:
 *         description: Admin found
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post('/get-admin-with-phone', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminWithPhone));

/**
 * @swagger
 * /admin/get-admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Admin Service]
 *     responses:
 *       200:
 *         description: List of admins
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/get-admins', extractAdminIdMiddleware, asyncHandler(AdminController.getAdmins));

/**
 * @swagger
 * /admin/get-admins-with-unique-data:
 *   post:
 *     summary: Get admins with unique data
 *     tags: [Admin Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: string
 *                 description: "Data to search for (email, phone, name, etc.)"
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: List of admins matching the query
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/get-admins-with-unique-data', extractAdminIdMiddleware, asyncHandler(AdminController.getAdminsWithUniqueData));

/**
 * @swagger
 * /admin/get-users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin Service]
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get('/get-users', extractAdminIdMiddleware, asyncHandler(AdminController.getUsers));

/**
 * @swagger
 * /admin/clear-cookies:
 *   post:
 *     summary: Clear all cookies
 *     tags: [Admin Service]
 *     responses:
 *       200:
 *         description: Cookies cleared successfully
 *       500:
 *         description: Server error
 */
router.post('/clear-cookies', asyncHandler(AdminController.clearAllCookies));

/**
 * @swagger
 * /admin/test-auth-communication:
 *   post:
 *     summary: Test communication with auth service
 *     tags: [Admin Service]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Communication test results
 *       500:
 *         description: Server error
 */
router.post('/test-auth-communication', asyncHandler(AdminController.testAuthCommunication));

/**
 * @swagger
 * /admin/test-service:
 *   get:
 *     summary: Test admin service operation
 *     tags: [Admin Service]
 *     responses:
 *       200:
 *         description: Service is operational
 *       500:
 *         description: Server error
 */
router.get('/test-service', asyncHandler(AdminController.testService));

module.exports = router;
