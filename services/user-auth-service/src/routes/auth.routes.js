const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

// Controller'ın register metodunu asyncHandler ile sarıyoruz
router.post('/register', asyncHandler(authController.register.bind(authController)));
router.post('/send-verification-email', asyncHandler(authController.sendVerificationEmail.bind(authController)));
router.post('/verify-email', asyncHandler(authController.verifyEmail.bind(authController)));

router.post('/login-with-email-send-code', asyncHandler(authController.loginWithEmailSendCode.bind(authController)));
router.post('/login-with-email-verify-code', asyncHandler(authController.loginWithEmailVerifyCode.bind(authController)));
router.post('/login-with-email-password', asyncHandler(authController.loginWithEmailPassword.bind(authController)));
router.post('/login-with-phone-password', asyncHandler(authController.loginWithPhonePassword.bind(authController)));
router.get('/logout', asyncHandler(authController.logout.bind(authController)));
router.get('/check-phone', asyncHandler(authController.checkPhone.bind(authController)));
router.get('/check-email', asyncHandler(authController.checkEmail.bind(authController)));

router.post('/update-user', asyncHandler(authController.updateUser.bind(authController)));
router.get('/update-user-unique-request', asyncHandler(authController.updateUserUniqueRequest.bind(authController)));
router.get('/verify-update-request', asyncHandler(authController.verifyUpdateRequest.bind(authController)));
router.get('/get-user', asyncHandler(authController.getUser.bind(authController)));
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

router.get('/health', (req, res) => {
    res.status(200).json({ message: 'OK' });
});

router.get('/time', asyncHandler(authController.getTime.bind(authController)));

module.exports = router;