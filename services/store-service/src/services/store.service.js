const Store = require('../models/store.model'); 
const Admin = require('../../../../shared/models/admin.model');
const validationUtils = require('../../../../shared/utils/validationUtils');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const errorMessages = require('../../../../shared/config/errorMessages');
const successMessages = require('../../../../shared/config/successMessages');
const { logger } = require('../../../../shared/utils/logger');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const eventPublisher = require('../../../../shared/services/event/eventPublisher');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');
const helpers = require('../../../../shared/utils/helpers');

//STORE SERVİCE EN BAŞTAN YAZILACAK


class StoreService {

    /**
     * Hata durumlarını yönetmek için yardımcı metod
     * @param {Error} error - Yakalanan hata
     * @param {String} errorMessage - Kullanıcıya gösterilecek hata mesajı
     */
    _handleError(error, errorMessage) {
        
        // Hatayı logla
        logger.error(errorMessage, { 
            error: error.message, 
            stack: error.stack
        });

        // Hata mesajında anahtar kelimeler var mı diye kontrol et
        const errorMsg = error.message && error.message.toLowerCase();
        
        if (errorMsg && errorMsg.includes('bulunamadı')) {
            throw new NotFoundError(errorMessage);
        } else if (errorMsg && (errorMsg.includes('zaten var') || errorMsg.includes('already exists'))) {
            throw new ConflictError(errorMessage);
        } else if (errorMsg && (errorMsg.includes('geçersiz') || errorMsg.includes('invalid'))) {
            throw new ValidationError(errorMessage);
        } else if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
            // Zaten tiplendirilmiş hata ise aynen fırlat
            throw error;
        } else {
            // Tiplendirilmemiş hatalar için, mesaja göre hata tipi oluştur
            if (errorMessage.toLowerCase().includes('bulunamadı')) {
                throw new NotFoundError(errorMessage);
            } else {
                throw new Error(errorMessage);
            }
        }
    }

    _handleErrorWithType(response, adminId, errorMessage) {

        logger.error(errorMessage, { 
            adminId,
            error: response.message 
        });

        // Hata nesnesine ek veri ekliyoruz
        const errorData = {
            id: response.id || adminId,
            receivedData: response.receivedData,
            timestamp: response.timestamp || new Date().toISOString()
        };

        if (response.error === 'ValidationError') {
            const error = new ValidationError(errorMessage);
            error.data = errorData;
            throw error;
        } else if (response.error === 'NotFoundError') {
            const error = new NotFoundError(errorMessage);
            error.data = errorData;
            throw error;
        } else if (response.error === 'ConflictError') {
            const error = new ConflictError(errorMessage);
            error.data = errorData;
            throw error;
        } else {
            const error = new Error(errorMessage);
            error.data = errorData;
            throw error;
        }        
        
    }

    _handleSuccess(logMessage,successMessage, data) {

        logger.info(logMessage, { 
            data,
            success: true
        });

        return {
            success: true,
            message: successMessage,
            data: data
        };
    }

    async createStore(data) {
        try {
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

    async changeStoreStatus(data) {
        try {
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


    // hala hatalı çözemedik bunla da
    async addWorker(data) {
        try {
            const storeId = data.storeId;
            const role = data.role;
            const email = data.email;
            const phone = data.phone;

            if (email && phone) {
                throw new ConflictError(errorMessages.CONFLICT.DONT_ENTER_EMAIL_AND_PHONE);
            }

            if (!email && !phone) {
                throw new ValidationError(errorMessages.INVALID.INVALID_ADD_WORKER_DATA);
            }

            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }

            let admin;
            let requestData;

            if (email) {
                logger.info('Get admin from admin-auth service', { 
                    email: email,
                });
                
                requestData = {
                    email: email,
                    timestamp: new Date().toISOString()
                };

                const response = await eventPublisher.request('admin.auth.getAdminWithEmail', requestData, {timeout: 10000});

                if (!response.success) {
                    this._handleErrorWithType(response, email, "Admin bulunamadı");
                }

                admin = response.admin;
            } else {
                logger.info('Get admin from admin-auth service', { 
                    phone: phone,
                });
                
                requestData = {
                    phone: phone,
                    timestamp: new Date().toISOString()
                };

                const response = await eventPublisher.request('admin.auth.getAdminWithPhone', requestData, {timeout: 10000});

                if (!response.success) {
                    this._handleErrorWithType(response, phone, "Admin bulunamadı");
                }

                admin = response.admin;
            }

            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            // Consistently use admin.id throughout the code
            const adminId = admin._id ? admin._id.toString() : admin.id ? admin.id.toString() : null;
            
            if (!adminId) {
                throw new ValidationError("Admin ID bulunamadı");
            }

            // Check if worker already exists using string comparison
            if (store.workers.some(worker => String(worker.id) === adminId)) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_ALREADY_EXISTS);
            }

            const worker = {
                id: adminId,
                name: admin.name,
                surname: admin.surname,
                email: admin.email,
                phone: admin.phone,
                role: role
            };
            
            store.workers.push(worker);
            await store.save();

            logger.info('Add worker to store', { 
                id: adminId,
                storeId: storeId,
                role: role
            });

            // Admin-auth servisine istek gönder
            requestData = {
                id: adminId,
                storeId: storeId,
                role: role,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine store ekle
            const addStoreResponse = await eventPublisher.request('admin.auth.addStoreToWorker', requestData, {
                timeout: 10000
            });
            
            if (!addStoreResponse.success) {
                this._handleErrorWithType(addStoreResponse, email || phone, "Admine store ekleme işlemi başarısız");
            }

            return {
                message: successMessages.STORE.WORKER_ADDED,
                worker: worker
            };
        } catch (error) {
            logger.error('Store add worker error', { 
                error: error.message, 
                stack: error.stack,
                storeId: data.storeId || null,
                email: data.email || null,
                phone: data.phone || null
            });
            throw error;
        }
    }


    //Yeni worker ekleme methdou yazılacak, aşagıdaki sorunlu
    async addWorkerOld(data) {
        try {
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
                logger.info('Get admin from admin-auth service', { 
                    phone: phone,
                });
    
                // Admin-auth servisine istek gönder
                const requestData = {
                    phone: phone,
                    timestamp: new Date().toISOString()
                };
    
                // Admin-auth servisine istek gönder
                const response = await eventPublisher.request('admin.auth.getAdminWithPhone', requestData, {
                    timeout: 10000
                });
                
                if (!response.success) {
                    this._handleErrorWithType(response, phone, "Admin bulunamadı");
                }
                admin = response.admin;
            } else {
                const email = data.email;
                if (!email) {
                    throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
                }
                logger.info('Get admin from admin-auth service', { 
                    email: email,
                });
    
                // Admin-auth servisine istek gönder
                const requestData = {
                    email: email,
                    timestamp: new Date().toISOString()
                };
    
                // Admin-auth servisine istek gönder
                const response = await eventPublisher.request('admin.auth.getAdminWithEmail', requestData, {
                    timeout: 10000
                });
                
                if (!response.success) {
                    this._handleErrorWithType(response, email, "Admin bulunamadı");
                }
                admin = response.admin;
            }
    
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            const workers = store.workers;
            if (workers.some(worker => worker.id.equals(admin._id))) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_ALREADY_EXISTS);
            }

            const worker = {
                id: admin.id,
                name: admin.name,
                surname: admin.surname,
                email: admin.email,
                phone: admin.phone,
                role: role
            }
            store.workers.push(worker);
            await store.save();

            logger.info('Add worker to store', { 
                id: admin._id,
                storeId: storeId,
                role: role
            });

            // Admin-auth servisine istek gönder
            const requestData = {
                email: email,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getAdminWithEmail', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, email, "Admin bulunamadı");
            }



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


    async changeWorkerRole(data) {
        try {
            const storeId = data.storeId;
            const role = data.role;
            const email = data.email;
            const phone = data.phone;

            if (email && phone) {
                throw new ConflictError(errorMessages.CONFLICT.DONT_ENTER_EMAIL_AND_PHONE);
            }

            if (!email && !phone) {
                throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
            }

            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }

            let admin;
            let requestData;

            if (email) {
                logger.info('Get admin from admin-auth service', { 
                    email: email,
                });
                
                requestData = {
                    email: email,
                    timestamp: new Date().toISOString()
                };

                const response = await eventPublisher.request('admin.auth.getAdminWithEmail', requestData, {timeout: 10000});

                if (!response.success) {
                    this._handleErrorWithType(response, email, "Admin bulunamadı");
                }

                admin = response.admin;
            } else {
                logger.info('Get admin from admin-auth service', { 
                    phone: phone,
                });
                
                requestData = {
                    phone: phone,
                    timestamp: new Date().toISOString()
                };

                const response = await eventPublisher.request('admin.auth.getAdminWithPhone', requestData, {timeout: 10000});

                if (!response.success) {
                    this._handleErrorWithType(response, phone, "Admin bulunamadı");
                }

                admin = response.admin;
            }

            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            // Consistently use admin.id throughout the code
            const adminId = admin._id ? admin._id.toString() : admin.id ? admin.id.toString() : null;
            
            if (!adminId) {
                throw new ValidationError("Admin ID bulunamadı");
            }

            // Check if worker exists using string comparison
            if (!store.workers.some(worker => String(worker.id) === adminId)) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_NOT_FOUND);
            }

            await Store.updateOne(
                { storeId: storeId, "workers.id": adminId },
                { $set: { "workers.$.role": role } }
            );

            const updatedStore = await Store.findOne({storeId});
            const updatedWorker = updatedStore.workers.find(worker => String(worker.id) === adminId);

            return {
                message: successMessages.STORE.WORKER_ROLE_CHANGED,
                worker: updatedWorker
            };
        } catch (error) {
            logger.error('Store change worker role error', { 
                error: error.message, 
                stack: error.stack,
                storeId: data.storeId || null,
                email: data.email || null,
                phone: data.phone || null
            });
            throw error;
        }
    }

    async deleteWorker(data) {
        try {
            const storeId = data.storeId;
            const email = data.email;
            const phone = data.phone;

            if (email && phone) {
                throw new ConflictError(errorMessages.CONFLICT.DONT_ENTER_EMAIL_AND_PHONE);
            }

            if (!email && !phone) {
                throw new ValidationError(errorMessages.INVALID.INVALID_DATA);
            }

            const store = await Store.findOne({storeId});
            if (!store) {
                throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
            }

            let admin;
            let requestData;

            if (email) {
                logger.info('Get admin from admin-auth service', { 
                    email: email,
                });
                
                requestData = {
                    email: email,
                    timestamp: new Date().toISOString()
                };

                const response = await eventPublisher.request('admin.auth.getAdminWithEmail', requestData, {timeout: 10000});

                if (!response.success) {
                    this._handleErrorWithType(response, email, "Admin bulunamadı");
                }

                admin = response.admin;
            } else {
                logger.info('Get admin from admin-auth service', { 
                    phone: phone,
                });
                
                requestData = {
                    phone: phone,
                    timestamp: new Date().toISOString()
                };

                const response = await eventPublisher.request('admin.auth.getAdminWithPhone', requestData, {timeout: 10000});

                if (!response.success) {
                    this._handleErrorWithType(response, phone, "Admin bulunamadı");
                }

                admin = response.admin;
            }

            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN);
            }

            // Consistently use admin.id throughout the code
            const adminId = admin._id ? admin._id.toString() : admin.id ? admin.id.toString() : null;
            
            if (!adminId) {
                throw new ValidationError("Admin ID bulunamadı");
            }

            // Check if worker exists
            const workerIndex = store.workers.findIndex(worker => String(worker.id) === adminId);
            if (workerIndex === -1) {
                throw new ConflictError(errorMessages.CONFLICT.WORKER_NOT_FOUND);
            }

            // Remove the worker
            store.workers.splice(workerIndex, 1);
            await store.save();

            // Notify admin-auth service about worker removal
            requestData = {
                id: adminId,
                storeId: storeId,
                timestamp: new Date().toISOString()
            };

            const removeResponse = await eventPublisher.request('admin.auth.removeStoreFromWorker', requestData, {
                timeout: 10000
            });
            
            if (!removeResponse.success) {
                logger.warn('Failed to remove store from admin in auth service', {
                    adminId,
                    storeId,
                    response: removeResponse
                });
                // We continue even if this fails, as the worker has been removed from the store
            }

            return {
                message: successMessages.STORE.WORKER_DELETED,
                workers: store.workers
            };
        } catch (error) {
            logger.error('Store delete worker error', { 
                error: error.message, 
                stack: error.stack,
                storeId: data.storeId || null,
                email: data.email || null,
                phone: data.phone || null
            });
            throw error;
        }
    }

    async searchStore(data) {
        try {
            const searchType = data.searchType;
            const searchValue = data.searchValue;
            if (searchType === 'region') {
                const stores = await Store.find({"location.region": searchValue});
                return stores;
            } else if (searchType === 'city') {
                const stores = await Store.find({"location.city": searchValue});
                return stores;
            } else if (searchType === 'district') {
                const stores = await Store.find({"location.district": searchValue});
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

    //+
    async getLogin(loggedAdminId) {
        try {
            logger.info('Getting admin details from admin-auth service', { adminId: loggedAdminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: loggedAdminId.toString(),
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getMe', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, loggedAdminId, "Admin detayları alınamadı");
            } 

            return this._handleSuccess('Received admin details from admin-auth service',successMessages.SEARCH.ADMIN_FOUND, response.admin);
        } catch (error) {
            this._handleError(error, "Admin detayları alınamadı");
        }
    }



    async initializeEventListeners() {
        try {

            await eventSubscriber.respondTo('store.getStore', async (payload, metadata) => {

                logger.info('Received getStore request', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                try {
                    const store = await Store.findOne({storeId: payload.storeId});
                    if (!store) {
                        throw new NotFoundError(errorMessages.NOT_FOUND.STORE);
                    }

                    return {
                        success: true,
                        message: `Store bulundu`,
                        store: store,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                    
                } catch (error) {
                    logger.error(`Error getting store with storeId ${payload.storeId}`, {
                        error: error.message,
                        stack: error.stack,
                        storeId: payload.storeId
                    });
                    
                    return {
                        success: false,
                        message: error.message,
                        error: error.name,
                        code: error.statusCode || 400,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }
            });


            logger.info('Store service event listeners initialized');
        } catch (error) {
            logger.error('Failed to initialize store service event listeners', { error: error.message, stack: error.stack });
            throw error;
        }
    }
}

module.exports = new StoreService();
