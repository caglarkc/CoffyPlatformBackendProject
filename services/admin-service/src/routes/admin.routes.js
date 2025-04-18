const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const extractAdminIdMiddleware = require('../middlewares/extractAdminIdMiddleware');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

// GET /api/admin/me - Get current admin information
router.get('/me', extractAdminIdMiddleware, asyncHandler(AdminController.getMe));

// PUT /api/admin/change-data-many - Update admin data many
router.post('/change-data-many', extractAdminIdMiddleware, asyncHandler(AdminController.changeAdminDataMany));

// PUT /api/admin/change-data-just-one - Update admin data just one
router.post('/change-data-just-one', extractAdminIdMiddleware, asyncHandler(AdminController.changeAdminDataJustOne));

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
