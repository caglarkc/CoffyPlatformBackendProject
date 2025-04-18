const AdminService = require('../services/admin.service');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const errorMessages = require('../../../../shared/config/errorMessages');
const { logger } = require('../../../../shared/utils/logger');

class AdminController {
    
    /**
     * Hata durumlarını yönetmek için yardımcı metod
     * @param {Error} error - Yakalanan hata
     * @param {Object} res - Express response object
     * @param {String} errorMessage - Kullanıcıya gösterilecek hata mesajı
     * @param {Number} defaultStatusCode - Varsayılan HTTP durum kodu (isteğe bağlı, varsayılan 500)
     * @returns {Object} HTTP yanıtı
     */
    _handleError(error, res, errorMessage, defaultStatusCode = 500) {
        // Hata tipine göre uygun HTTP durum kodunu belirle
        let statusCode = defaultStatusCode;
        
        // Hatayı logla
        if (error) {
            logger.error(errorMessage, { 
                error: error.message, 
                stack: error.stack
            });

            // Hata tipine göre status kodu belirle
            if (error instanceof ValidationError) {
                statusCode = 400; // Bad Request
            } else if (error instanceof NotFoundError) {
                statusCode = 404; // Not Found
            } else if (error instanceof ConflictError) {
                statusCode = 409; // Conflict
            } else if (error.statusCode) {
                statusCode = error.statusCode;
            }

            // Hata nesnesinden ek veri varsa include et
            const response = { 
                success: false,
                status: statusCode,
                message: errorMessage,
                error: error.message,
                type: error.constructor.name,
                timestamp: new Date().toISOString()
            };
            
            // Hata nesnesinden varsa ek veriyi response'a ekle
            if (error.data) {
                response.data = error.data;
            }

            return res.status(statusCode).json(response);
        } else {
            return res.status(statusCode).json({ 
                success: false,
                status: statusCode,
                message: errorMessage,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Auth servisi ile iletişimi test et
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    testAuthCommunication = async (req, res) => {
        try {
            const testData = req.body || { test: "default-test-data" };
            const result = await AdminService.testCommunication(testData);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "İletişim testi başarısız oldu");
        }
    }

    /**
     * Admin bilgilerini getir
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    getMe = async (req, res) => {
        try {
            // req.adminId middleware tarafından ekleniyor
            const adminId = req.adminId;
            
            // AdminId yoksa hata döndür
            if (!adminId) {
                // Middleware'den gelen özel hata mesajını kullan, yoksa genel mesaj
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);
            }
            
            // Admin bilgilerini getir
            const result = await AdminService.getMe(adminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin bilgileri getirilemedi");
        }
    }

    changeAdminDataMany = async (req, res) => {
        try {
            const adminId = req.adminId;
            const { name, surname, email, phone } = req.body;
            
            // AdminId yoksa hata döndür
            if (!adminId) {
                // Middleware'den gelen özel hata mesajını kullan, yoksa genel mesaj
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);
            }
            
            // newData kontrolü
            if (!newData || typeof newData !== 'object') {
                return this._handleError(null, res, errorMessages.INVALID.INVALID_DATA, 400);
            }
      

            // En az bir değer girilmiş mi kontrol et
            if (!name && !surname && !email && !phone) {
                return this._handleError(null, res, errorMessages.INVALID.EMPTY_DATA_ONE, 400);
            }

            // Boş olmayan değerleri newData objesine ekle
            const newData = {};
            if (name) newData.name = name;
            if (surname) newData.surname = surname; 
            if (email) newData.email = email;
            if (phone) newData.phone = phone;

            // Admin bilgilerini güncelle
            const result = await AdminService.changeAdminDataMany(adminId, newData);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Bilgi güncelleme işlemi başarısız oldu");
        }
    }

    changeAdminDataJustOne = async (req, res) => {
        try {
            const adminId = req.adminId;
            const newData = req.body.newData;
            const type = req.body.type;

            // AdminId yoksa hata döndür
            if (!adminId) {
                // Middleware'den gelen özel hata mesajını kullan, yoksa genel mesaj
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);
            }

            if (!type) {
                return this._handleError(null, res, errorMessages.INVALID.INVALID_TYPE, 400);
            }

            if (!newData) {
                return this._handleError(null, res, errorMessages.INVALID.EMPTY_DATA, 400);
            }

            if (type !== 'name' && type !== 'surname' && type !== 'email' && type !== 'phone') {
                return this._handleError(null, res, errorMessages.INVALID.INVALID_TYPE_VALUE, 400);
            }

            // Admin bilgilerini güncelle
            const result = await AdminService.changeAdminDataJustOne(adminId, newData, type);
            return res.status(200).json(result);

        } catch (error) {
            return this._handleError(error, res, "Bilgi güncelleme işlemi başarısız oldu");
        }
    }

    changeLocation = async (req, res) => {
        try {
            const adminId = req.adminId;
            const { location } = req.body;

            if (!adminId) {
                // Middleware'den gelen özel hata mesajını kullan, yoksa genel mesaj
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);
            }

            if (!location) {
                return this._handleError(null, res, errorMessages.INVALID.INVALID_LOCATION, 400);
            }

            if (location.city === "" && location.district === "" && location.region === "" && location.storeId === "") {
                return this._handleError(null, res, errorMessages.INVALID.EMPTY_DATA_ONE, 400);
            }

            if (location.city === "") {
                location.city = null;
            }

            if (location.district === "") {
                location.district = null;
            }
            if (location.region === "") {
                location.region = null;
            }
            if (location.storeId === "") {
                location.storeId = null;
            }
                    
            const result = await AdminService.changeLocation(adminId, location);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin konumu güncelleme işlemi başarısız oldu");
        }
    }

    deleteMe = async (req, res) => {
        try {
            const adminId = req.adminId;
            const result = await AdminService.deleteMe(adminId);

            if (result && result.success) {
                // Cookie'leri temizle
                res.clearCookie('accessToken');
                res.clearCookie('adminId');
                
                // Cookie options'ları tutarlı olması için orijinal cookie ayarlarıyla aynı tutuyoruz
                const cookieOptions = {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                };
                
                // Sıfır süreli olarak ayarlayıp temizle
                res.cookie('accessToken', '', { ...cookieOptions, maxAge: 0 });
                res.cookie('adminId', '', { ...cookieOptions, maxAge: 0 });
                
                // Cevaba logout olduğunu da ekleyelim
                result.loggedOut = true;
            }
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin silme işlemi başarısız oldu");
        }
    }

    downgradeRole = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.downgradeRole(req.body.adminId, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Rol düşürme işlemi başarısız oldu");
        }
    }

    upgradeRole = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.upgradeRole(req.body.adminId, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Rol yükseltme işlemi başarısız oldu");
        }
    }

    blockAdmin = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.blockAdmin(req.body.adminId, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin bloklama işlemi başarısız oldu");
        }
    }

    unblockAdmin = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.unblockAdmin(req.body.adminId, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin bloğu kaldırma işlemi başarısız oldu");
        }
    }

    getAdminWithId = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.getAdminWithId(req.body.adminId, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin getirme işlemi başarısız oldu");
        }
    }

    getAdminWithEmail = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.getAdminWithEmail(req.body.email, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin getirme işlemi başarısız oldu");
        }
    }

    getAdminWithPhone = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }
            const result = await AdminService.getAdminWithPhone(req.body.phone, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin getirme işlemi başarısız oldu");
        }
    }

    getAdmins = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;
            
            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.getAdmins(creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Adminleri getirme işlemi başarısız oldu");
        }
    }

    getAdminsWithUniqueData = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;
            
            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }
        
            const result = await AdminService.getAdminsWithUniqueData(req.body, creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Adminleri getirme işlemi başarısız oldu");
        }
    }

    getUsers = async (req, res) => {
        try {
            const creatorAdminId = req.adminId;

            if (!creatorAdminId) {
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);            
            }

            const result = await AdminService.getUsers(creatorAdminId);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Kullanıcıları getirme işlemi başarısız oldu");
        }
    }

    changeAnotherAdminDataMany = async (req, res) => {
        try {
            const adminId = req.body.adminId;
            const { name, surname, email, phone } = req.body;
            
            // AdminId yoksa hata döndür
            if (!adminId) {
                // Middleware'den gelen özel hata mesajını kullan, yoksa genel mesaj
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);
            }

            // En az bir değer girilmiş mi kontrol et
            if (!name && !surname && !email && !phone) {
                return this._handleError(null, res, errorMessages.INVALID.EMPTY_DATA_ONE, 400);
            }

            // Boş olmayan değerleri newData objesine ekle
            const newData = {};
            if (name) newData.name = name;
            if (surname) newData.surname = surname; 
            if (email) newData.email = email;
            if (phone) newData.phone = phone;

            // Admin bilgilerini güncelle
            const result = await AdminService.changeAnotherAdminDataMany(adminId, newData);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Bilgi güncelleme işlemi başarısız oldu");
        }
    }

    changeAnotherAdminDataJustOne = async (req, res) => {
        try {
            const adminId = req.body.adminId;
            const newData = req.body.newData;
            const type = req.body.type;

            // AdminId yoksa hata döndür
            if (!adminId) {
                // Middleware'den gelen özel hata mesajını kullan, yoksa genel mesaj
                const errorMsg = req.customAuthErrorMessage || errorMessages.INVALID.INVALID_ID;
                return this._handleError(null, res, errorMsg, 401);
            }

            if (!type) {
                return this._handleError(null, res, errorMessages.INVALID.INVALID_TYPE, 400);
            }

            if (!newData) {
                return this._handleError(null, res, errorMessages.INVALID.EMPTY_DATA, 400);
            }

            if (type !== 'name' && type !== 'surname' && type !== 'email' && type !== 'phone') {
                return this._handleError(null, res, errorMessages.INVALID.INVALID_TYPE_VALUE, 400);
            }

            
            const result = await AdminService.changeAnotherAdminDataJustOne(adminId, newData, type);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Bilgi güncelleme işlemi başarısız oldu");
        }
    }
    
    changeAnotherAdminLocation = async (req, res) => {
        try {
            const result = await AdminService.changeAnotherAdminLocation(req.body);
            return res.status(200).json(result);
        } catch (error) {
            return this._handleError(error, res, "Admin konumu güncelleme işlemi başarısız oldu");
        }
    }

    /**
     * Test endpoint for checking if this service is running
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object 
     */
    async testService(req, res) {
        try {
            return res.status(200).json({
                success: true,
                message: "Admin servisi çalışıyor",
                serviceInfo: {
                    name: "admin-service",
                    status: "active",
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
    
    /**
     * Tüm cookie'leri temizleyen endpoint
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    clearAllCookies = async (req, res) => {
        try {
            // Bilinen tüm cookie'leri temizle
            res.clearCookie('accessToken');
            res.clearCookie('adminId');
            
            // Cookie options'ları tutarlı olması için orijinal cookie ayarlarıyla aynı tutuyoruz
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            };
            
            // Diğer olası cookie'leri boş değerle ve sıfır süreli olarak ayarlayıp temizle
            // Bu, tarayıcıda kalabilecek diğer cookie'leri de temizler
            res.cookie('accessToken', '', { ...cookieOptions, maxAge: 0 });
            res.cookie('adminId', '', { ...cookieOptions, maxAge: 0 });
            
            return res.status(200).json({
                success: true,
                message: "Tüm cookie'ler başarıyla temizlendi",
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return this._handleError(error, res, "Cookie'ler temizlenirken bir hata oluştu");
        }
    }
}

module.exports = new AdminController();