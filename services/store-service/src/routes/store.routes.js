const express = require('express');
const router = express.Router();
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');
const StoreController = require('../controllers/store.controller');
const extractAdminIdMiddleware = require('../../../admin-service/src/middlewares/extractAdminIdMiddleware');
const checkRole = require('../middlewares/checkRoleMiddleware');

router.post('/create-store', extractAdminIdMiddleware, checkRole(4), asyncHandler(StoreController.createStore));
router.get('/get-store', extractAdminIdMiddleware, checkRole(0),asyncHandler(StoreController.getStore));
router.post('/change-store-status', extractAdminIdMiddleware, checkRole(4), asyncHandler(StoreController.changeStoreStatus));
router.post('/add-worker', extractAdminIdMiddleware, checkRole(4), asyncHandler(StoreController.addWorker));
router.post('/change-worker-role', extractAdminIdMiddleware, checkRole(4), asyncHandler(StoreController.changeWorkerRole));
router.post('/delete-worker', extractAdminIdMiddleware, checkRole(4), asyncHandler(StoreController.deleteWorker));
router.get('/get-store-workers', extractAdminIdMiddleware, checkRole(0), asyncHandler(StoreController.getStoreWorkers));
router.post('/search-store', extractAdminIdMiddleware, checkRole(0), asyncHandler(StoreController.searchStore));
router.get('/get-login', extractAdminIdMiddleware, checkRole(0), asyncHandler(StoreController.getLogin));

router.get('/health', (req, res) => {
    res.status(200).json({ message: 'OK' });
});

module.exports = router;