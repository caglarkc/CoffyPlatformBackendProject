const StoreService = require('../services/store.service');


class StoreController {

    async createStore(req, res, next) {
        try {
            const result = await StoreService.createStore(req.body);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async changeStoreStatus(req, res, next) {
        try {
            const result = await StoreService.changeStoreStatus(req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getStore(req, res, next) {
        try {
            const storeId = req.query.storeId;
            const store = await StoreService.getStore(storeId);
            return res.status(200).json(store);
        } catch (error) {
            next(error);
        }
    }
    
    async addWorker(req, res, next) {
        try {
            const result = await StoreService.addWorker(req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async changeWorkerRole(req, res, next) {
        try {
            const result = await StoreService.changeWorkerRole(req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteWorker(req, res, next) {
        try {
            const result = await StoreService.deleteWorker(req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getLogin(req, res, next) {
        try {
            const loggedAdminId = req.adminId;
            const admin = await StoreService.getLogin(loggedAdminId);
            return res.status(200).json(admin);
        } catch (error) {
            next(error);
        }
    }

    async getStoreWorkers(req, res, next) {
        try {
            const storeId = req.query.storeId;
            const result = await StoreService.getStoreWorkers(storeId);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async searchStore(req, res, next) {
        try {
            const result = await StoreService.searchStore(req.body);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}


module.exports = new StoreController();
