const StoreService = require('../services/store.service');


class StoreController {

    async createStore(req, res, next) {
        try {
            const loggedAdmin = req.admin;
            const result = await StoreService.createStore(req.body, loggedAdmin);
            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    async changeStoreStatus(req, res, next) {
        try {
            const loggedAdmin = req.admin;
            const result = await StoreService.changeStoreStatus(req.body, loggedAdmin);
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
            const loggedAdmin = req.admin;
            const result = await StoreService.addWorker(req.body, loggedAdmin);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async changeWorkerRole(req, res, next) {
        try {
            const loggedAdmin = req.admin;
            const result = await StoreService.changeWorkerRole(req.body, loggedAdmin);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteWorker(req, res, next) {
        try {
            const loggedAdmin = req.admin;
            const result = await StoreService.deleteWorker(req.body, loggedAdmin);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getLogin(req, res, next) {
        try {
            const loggedAdmin = req.admin;
            if (loggedAdmin) {
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "Login successful",
                    admin: loggedAdmin
                });
            }       
            else {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Login failed"
                });
            }
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
            const loggedAdmin = req.admin;
            const result = await StoreService.searchStore(req.body, loggedAdmin);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}


module.exports = new StoreController();
