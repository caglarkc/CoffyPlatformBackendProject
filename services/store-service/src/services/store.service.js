const Store = require('../models/store.model'); 
const Admin = require('../../../../shared/models/admin.model');
const validationUtils = require('../../../../shared/utils/validationUtils');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const errorMessages = require('../../../../shared/config/errorMessages');
const successMessages = require('../../../../shared/config/successMessages');
const logger = require('../../../../shared/utils/logger');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const helpers = require('../../../../shared/utils/helpers');

class StoreService {

    async createStore(data, loggedAdmin) {
        try {
            const admin = await Admin.findById(loggedAdmin._id);
            validationUtils.validateAdminWithPermission(admin, 4);
            validationUtils.validateCreateStore(data);
            const storeId = data.storeId;
            const existStore = await Store.findOne({storeId});
            if (existStore) {
                throw new ConflictError(errorMessages.CONFLICT.STOREID_ALREADY_EXISTS);
            }

            const name = data.name;
            const region = data.region;
            const city = data.city;
            const district = data.district;
            const location = {region, city, district};
            const workers = [];
            const status = 'active';

            const store = await Store.create({name, storeId, location, workers, status});
            
            const message = {
                message: successMessages.STORE.STORE_CREATED,
                storeId: store.storeId
            }
            
            return message;
        } catch (error) {
            logger.error('Store creation error', { 
                error: error.message, 
                stack: error.stack,
                creatorId: loggedAdmin?._id 
            });
            throw error;
        }
    }

    async getStore(storeId) {
        try {
            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }
            return store;
        } catch (error) {
            logger.error('Store get error', { 
                error: error.message, 
                stack: error.stack,
                storeId: storeId
            });
            throw error;
        }
    }

    async changeStoreStatus(data, loggedAdmin) {
        try {
            const creatorAdmin = await Admin.findById(loggedAdmin._id);
            validationUtils.validateAdminWithPermission(creatorAdmin, 4);
            const storeId = data.storeId;
            const status = data.status;
            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }
            if (status !== 'active' && status !== 'tempClosed' && status !== 'closed') {
                throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
            }
            await Store.updateOne({storeId}, {$set: {status}});
            const updatedStore = await Store.findOne({storeId});
            return {
                message: successMessages.STORE.STORE_STATUS_CHANGED,
                store: updatedStore
            }
        } catch (error) {
            throw error;
        }
    }


    async getStoreWorkers(storeId) {
        try {
            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }
            return store.workers;
        } catch (error) {
            throw error;
        }
    }

    async addWorker(data, loggedAdmin) {
        try {
            const creatorAdmin = await Admin.findById(loggedAdmin._id);
            validationUtils.validateAdminWithPermission(creatorAdmin, 4);
            const storeId = data.storeId;
            const role = data.role;
            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }

            let admin;
            const email = data.email;

            if (email && data.phone) {
                throw new ConflictError(errorMessages.CONFLICT.DONT_ENTER_EMAIL_AND_PHONE);
            }

            if (!email) {
                const phone = data.phone;
                if (!phone) {
                    throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
                }
                admin = await Admin.findOne({phone: helpers.hashAdminData(phone)});
                if (!admin) {
                    admin = await Admin.findOne({phone: helpers.hashCreaterData(phone)});
                }
            } else {
                admin = await Admin.findOne({email: helpers.hashAdminData(email)});
                if (!admin) {
                    admin = await Admin.findOne({email: helpers.hashCreaterData(email)});
                }
            }
    
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            const workers = store.workers;
            if (workers.some(worker => worker.id.equals(admin._id))) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_ALREADY_EXISTS);
            }

            const worker = {
                id: admin._id,
                name: admin.name,
                surname: admin.surname,
                email: admin.email,
                phone: admin.phone,
                role: role
            }
            store.workers.push(worker);
            await store.save();

            return {
                message: successMessages.STORE.WORKER_ADDED,
                worker: worker
            }
        } catch (error) {
            logger.error('Store add worker error', { 
                error: error.message, 
                stack: error.stack,
                storeId: data.storeId || null,
                workerId: data.workerId || null
            });
            throw error;
        }
    }

    async changeWorkerRole(data, loggedAdmin) {
        try {
            const creatorAdmin = await Admin.findById(loggedAdmin._id);
            validationUtils.validateAdminWithPermission(creatorAdmin, 4);
            const storeId = data.storeId;
            const role = data.role;
            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }

            let admin;
            const email = data.email;

            if (email && data.phone) {
                throw new ConflictError(errorMessages.CONFLICT.DONT_ENTER_EMAIL_AND_PHONE);
            }

            if (!email) {
                const phone = data.phone;
                if (!phone) {
                    throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
                }
                admin = await Admin.findOne({phone: helpers.hashAdminData(phone)});
                if (!admin) {
                    admin = await Admin.findOne({phone: helpers.hashCreaterData(phone)});
                }
            } else {
                admin = await Admin.findOne({email: helpers.hashAdminData(email)});
                if (!admin) {
                    admin = await Admin.findOne({email: helpers.hashCreaterData(email)});
                }
            }
    
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            const workers = store.workers;
            if (!workers.some(worker => worker.id.equals(admin._id))) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_NOT_FOUND);
            }

            await Store.updateOne(
                { storeId: storeId, "workers.id": admin._id },
                { $set: { "workers.$.role": role } }
            );

            const updatedStore = await Store.findOne({storeId});
            const updatedWorker = updatedStore.workers.find(worker => worker.id.equals(admin._id));

            const message = {
                message: successMessages.STORE.WORKER_ROLE_CHANGED,
                worker: updatedWorker
            }

            return message;
        } catch (error) {
            logger.error('Store change worker role error', { 
                error: error.message, 
                stack: error.stack,
                storeId: data.storeId || null,
                workerId: data.workerId || null
            });
            throw error;
        }
    }

    async deleteWorker(data, loggedAdmin) {
        try {
            const creatorAdmin = await Admin.findById(loggedAdmin._id);
            validationUtils.validateAdminWithPermission(creatorAdmin, 4);
            const storeId = data.storeId;
            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }

            let admin;
            const email = data.email;

            if (email && data.phone) {
                throw new ConflictError(errorMessages.CONFLICT.DONT_ENTER_EMAIL_AND_PHONE);
            }

            if (!email) {
                const phone = data.phone;
                if (!phone) {
                    throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
                }
                admin = await Admin.findOne({phone: helpers.hashAdminData(phone)});
                if (!admin) {
                    admin = await Admin.findOne({phone: helpers.hashCreaterData(phone)});
                }
            } else {
                admin = await Admin.findOne({email: helpers.hashAdminData(email)});
                if (!admin) {
                    admin = await Admin.findOne({email: helpers.hashCreaterData(email)});
                }
            }
    
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            const workers = store.workers;
            if (!workers.some(worker => worker.id.equals(admin._id))) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_NOT_FOUND);
            }
            workers.splice(workers.indexOf(admin._id), 1);
            await store.save();

            return {
                message: successMessages.STORE.WORKER_DELETED,
                workers: store.workers
            }


        } catch (error) {
            throw error;
        }
    }

    async searchStore(data, loggedAdmin) {
        try {
            const creatorAdmin = await Admin.findById(loggedAdmin._id);
            validationUtils.validateAdmin(creatorAdmin);
            const searchType = data.searchType;
            const searchValue = data.searchValue;
            if (searchType === 'region') {
                const stores = await Store.find({region: searchValue});
                return stores;
            } else if (searchType === 'city') {
                const stores = await Store.find({city: searchValue});
                return stores;
            } else if (searchType === 'district') {
                const stores = await Store.find({district: searchValue});
                return stores;
            } else if (searchType === 'status') {
                const stores = await Store.find({status: searchValue});
                return stores;
            } else if (searchType === 'name') {
                const stores = await Store.find({name: searchValue});
                return stores;
            }
            throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
        } catch (error) {
            throw error;
        }
    }

}

module.exports = new StoreService();
