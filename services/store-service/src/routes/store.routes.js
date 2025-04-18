const express = require('express');
const router = express.Router();
const {authAdminMiddleware} = require('../../../../shared/middlewares/adminMiddleware');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');
const StoreController = require('../controllers/store.controller');

router.post('/create-store', authAdminMiddleware, asyncHandler(StoreController.createStore));
router.get('/get-store', authAdminMiddleware, asyncHandler(StoreController.getStore));
router.post('/change-store-status', authAdminMiddleware, asyncHandler(StoreController.changeStoreStatus));
router.post('/add-worker', authAdminMiddleware, asyncHandler(StoreController.addWorker));
router.post('/change-worker-role', authAdminMiddleware, asyncHandler(StoreController.changeWorkerRole));
router.post('/delete-worker', authAdminMiddleware, asyncHandler(StoreController.deleteWorker));
router.post('/get-store-workers', authAdminMiddleware, asyncHandler(StoreController.getStoreWorkers));
router.post('/search-store', authAdminMiddleware, asyncHandler(StoreController.searchStore));
router.get('/get-login', authAdminMiddleware, asyncHandler(StoreController.getLogin));

router.get('/health', (req, res) => {
    res.status(200).json({ message: 'OK' });
});
module.exports = router;