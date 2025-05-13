const Admin = require('../models/admin.model');
const helpers = require('../../../../shared/utils/helpers');
const errorMessages = require('../../../../shared/config/errorMessages');
const successMessages = require('../../../../shared/config/successMessages');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const redisService = require('../../../../shared/services/redis.service');
const tokenService = require('../../../../shared/services/token.service');
const { validateName , validateSurname ,validatePassword} = require('../../../../shared/utils/textUtils');
const { getRedisClient } = require('../utils/database');
const { logger } = require('../../../../shared/utils/logger');
const eventPublisher = require('../../../../shared/services/event/eventPublisher');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');
const dotenv = require('dotenv');
dotenv.config();

const _formatAdminResponse = (admin) => {
    return {
        id: admin._id,
        email: admin.email,
        phone: admin.phone,
        name: admin.name,
        surname: admin.surname,
        role: admin.role,
        location: admin.location,
        whoCreate: admin.whoCreate
    };
};


class AdminService {


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

    async testCommunication(testData) {
        try {
            logger.info('Testing communication with auth service', { testData });
            
            // Test verisi oluştur
            const requestData = {
                message: "Bu bir test mesajıdır",
                testData,
                timestamp: new Date().toISOString()
            };
            
            // Auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.testCommunication', requestData, {
                timeout: 10000
            });
            
            logger.info('Received response from auth service', { response });
            return {
                success: true,
                message: "Auth servisi ile iletişim testi",
                sentData: requestData,
                receivedResponse: response
            };
        } catch (error) {
            this._handleError(error, "Auth servisi ile iletişim testi başarısız");
        }
    }

    async getMe(adminId) {
        try {
            logger.info('Getting admin details from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId.toString(),
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getMe', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin detayları alınamadı");
            } 

            return this._handleSuccess('Received admin details from admin-auth service',successMessages.SEARCH.ADMIN_FOUND, response.admin);
        } catch (error) {
            this._handleError(error, "Admin detayları alınamadı");
        }
    }

    async changeAdminDataMany(adminId, newData) {
        try {
            
            logger.info('Updating admin data from admin-auth service', { 
                adminId,
                fields: Object.keys(newData)
            });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId.toString(),
                newData: newData,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.changeAdminDataMany', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin bilgileri güncellenemedi");
            }

            return this._handleSuccess('Admin bilgileri admin-auth servisinde güncellendi',successMessages.UPDATE.ADMIN_DATA_UPDATED, response.admin);
        } catch (error) {
            this._handleError(error, "Admin bilgileri güncellenemedi");
        }
    }


    async changeAdminDataJustOne(adminId, newData, type) {
        try {
            logger.info('Updating admin data from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId.toString(),
                newData: newData,
                type: type,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.changeAdminDataJustOne', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin bilgileri güncellenemedi");
            }

            return this._handleSuccess('Admin bilgileri admin-auth servisinde güncellendi',successMessages.UPDATE.ADMIN_DATA_UPDATED, response.admin);
        } catch (error) {
            this._handleError(error, "Admin bilgileri güncellenemedi");
        }
    

    }
    

    async changeLocation(adminId, location) {
        try {
            logger.info('Updating admin location from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId.toString(),
                location: location,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.changeLocation', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin konumu güncellenemedi");
            }

            return this._handleSuccess('Admin konumu admin-auth servisinde güncellendi',successMessages.UPDATE.ADMIN_LOCATION_UPDATED, response.admin);

        } catch (error) {
            this._handleError(error, "Admin konumu güncellenemedi");
        }
    
    }

    async deleteMe(adminId) {
        try {
            logger.info('Deleting admin from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId.toString(),
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.deleteMe', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin silinemedi");
            }

            return this._handleSuccess('Admin silindi',successMessages.DELETE.ADMIN_DELETED, response.admin);

        } catch (error) {
            this._handleError(error, "Admin silinemedi");
        }
    }

    
    async downgradeRole(adminId, creatorAdminId) {
        try {
            logger.info('Downgrading admin role from admin-auth service', { adminId });

            logger.debug('Downgrading admin role from admin-auth service', { adminId, creatorAdminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.downgradeRole', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Rol düşürülemedi");
            }
            
            return this._handleSuccess('Admin rolü düşürüldü',successMessages.UPDATE.ADMIN_ROLE_DOWNGRADED, response.admin);

        } catch (error) {
            this._handleError(error, "Admin rolü düşürülemedi");
        }
    }  

    async upgradeRole(adminId, creatorAdminId) {
        try {
            logger.info('Upgrading admin role from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.upgradeRole', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Rol yükseltilemedi");
            }
            
            return this._handleSuccess('Admin rolü yükseltildi',successMessages.UPDATE.ADMIN_ROLE_UPGRADED, response.admin);

        } catch (error) {
            this._handleError(error, "Admin rolü yükseltilemedi");
        }
    }
    
    async blockAdmin(adminId, creatorAdminId) {
        try {
            logger.info('Blocking admin from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.blockAdmin', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin bloklanamadı");
            }

            return this._handleSuccess('Admin bloklandı',successMessages.UPDATE.ADMIN_BLOCKED, response.admin);
        } catch (error) {
            this._handleError(error, "Admin bloklanamadı");
        }
    }

    async unblockAdmin(adminId, creatorAdminId) {
        try {
            logger.info('Unblocking admin from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.unblockAdmin', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin bloğu kaldırılamadı");
            }

            return this._handleSuccess('Admin bloğu kaldırıldı',successMessages.UPDATE.ADMIN_UNBLOCKED, response.admin);
        } catch (error) {
            this._handleError(error, "Admin bloğu kaldırılamadı");
        }
    }


    async getAdminWithId(adminId, creatorAdminId) {
        try {
            logger.info('Getting admin with id from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getAdminWithId', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin bulunamadı");
            }

            return this._handleSuccess('Admin bulundu',successMessages.SEARCH.ADMIN_FOUND, response.admin);

        } catch (error) {
            this._handleError(error, "Admin bulunamadı");
        }
    }

    async getAdminWithEmail(email, creatorAdminId) {
        try {
            logger.info('Getting admin with email from admin-auth service', { email });

            // Admin-auth servisine istek gönder
            const requestData = {
                email: email,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getAdminWithEmail', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, email, "Admin bulunamadı");
            }

            return this._handleSuccess('Admin bulundu',successMessages.SEARCH.ADMIN_FOUND, response.admin);

        } catch (error) {
            this._handleError(error, "Admin bulunamadı");
        }
    }

    async getAdminWithPhone(phone, creatorAdminId) {
        try {
            logger.info('Getting admin with phone from admin-auth service', { phone });

            // Admin-auth servisine istek gönder
            const requestData = {
                phone: phone,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getAdminWithPhone', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, phone, "Admin bulunamadı");
            }

            return this._handleSuccess('Admin bulundu',successMessages.SEARCH.ADMIN_FOUND, response.admin);

        } catch (error) {
            this._handleError(error, "Admin bulunamadı");
        }
    }

    async getAdmins(creatorAdminId) {
        try {
            logger.info('Getting admins from admin-auth service', { creatorAdminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getAdmins', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, creatorAdminId, "Admin bulunamadı");
            }

            return this._handleSuccess('Admin bulundu',successMessages.SEARCH.ADMIN_FOUND, response.admins);

        } catch (error) {
            this._handleError(error, "Admin bulunamadı");
        }
    }

    async getAdminsWithUniqueData(data, creatorAdminId) {
        try {
            logger.info('Getting admins from admin-auth service', { creatorAdminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                data: data,
                creatorAdminId: creatorAdminId,
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getAdminsWithUniqueData', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, creatorAdminId, "Admin bulunamadı");
            }

            return this._handleSuccess('Admin bulundu',successMessages.SEARCH.ADMIN_FOUND, response.admins);

        } catch (error) {
            this._handleError(error, "Admin bulunamadı");
        }
    }

    async getUsers(creatorAdminId) {
        try {
            logger.info('Getting users from user-auth service', { creatorAdminId });

            // User-auth servisine istek gönder
            const requestData = {
                timestamp: new Date().toISOString()
            };

            const response = await eventPublisher.request('user.auth.getUsers', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                this._handleErrorWithType(response, creatorAdminId, "Kullanıcı bulunamadı");
            }

            return this._handleSuccess('Kullanıcı bulundu',successMessages.SEARCH.USER_FOUND, response.users);

        } catch (error) {
            this._handleError(error, "Kullanıcı bulunamadı");
        }
    }




    /**
     * Initialize event bus listeners for the admin service
     */
    async initializeEventListeners() {
        try {
            logger.info('Initializing event listeners for admin service');
            
            // Admin bilgilerini isteyen olursa cevap ver
            await eventSubscriber.subscribe('admin.getAdminInfo', async (data) => {
                try {
                    const { adminId } = data;
                    logger.info('Received request for admin info', { adminId });
                    
                    // Admin bilgilerini al
                    const admin = await Admin.findById(adminId);
                    if (!admin) {
                        return { 
                            success: false, 
                            error: 'NotFoundError',
                            message: 'Admin bulunamadı', 
                            timestamp: new Date().toISOString() 
                        };
                    }
                    
                    return {
                        success: true,
                        admin: _formatAdminResponse(admin),
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    logger.error('Error processing admin.getAdminInfo event', { 
                        error: error.message, 
                        stack: error.stack 
                    });
                    
                    return {
                        success: false,
                        error: error.name || 'Error',
                        message: error.message || 'Admin bilgileri alınamadı',
                        timestamp: new Date().toISOString()
                    };
                }
            });
            
            logger.info('Admin service event listeners initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize event listeners', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }
}

module.exports = new AdminService();