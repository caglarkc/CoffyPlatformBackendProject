const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');
const redisService = require('../../../../shared/services/redis.service');
const { getRequestContext } = require('../middlewares/requestContext');
const AdminAuthService = require('../services/admin.auth.service');
const { logger } = require('../../../../shared/utils/logger');

/**
 * Admin kimlik doğrulama middleware'i
 * Token kontrolü yapar ve admin bilgilerini request nesnesine ekler
 */
const authAdminMiddleware = async (req, res, next) => {
    try {
        // Token'ı hem Authorization header'dan hem cookie'den almaya çalış
        let token = null;
        
        // 1. Authorization header'dan kontrol et
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } 
        // 2. Cookie'den kontrol et
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        // Token yoksa, adminId cookie'si olup olmadığını kontrol et
        if (!token && req.cookies && req.cookies.adminId) {
            const adminId = req.cookies.adminId;
            try {
                // Redis'ten refresh token'ı kontrol et
                const refreshToken = await redisService.get(`auth:refresh:${adminId}`);
                
                if (refreshToken) {
                    // Refresh token varsa, yeni access token üret
                    logger.info('No access token, but adminId cookie found. Refreshing token.', { adminId });
                    
                    // Token yenileme işlemi
                    const result = await AdminAuthService.refreshAccessToken(adminId, refreshToken);
                    
                    if (result && result.accessToken) {
                        // Yeni token'ı cookie'ye ekle
                        res.cookie('accessToken', result.accessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 900000 // 15 dakika
                        });
                        
                        // Token'ı kullanımı için değişkene aktar
                        token = result.accessToken;
                        
                        // Bilgi log'u
                        logger.info('Access token automatically refreshed from adminId cookie', { 
                            adminId,
                            path: req.path,
                            source: 'adminMiddleware'
                        });

                        // İşlemin yenilendiğini belirt
                        req.tokenRefreshed = true;
                    }
                }
            } catch (refreshError) {
                logger.error('Error refreshing token from adminId cookie', {
                    error: refreshError.message,
                    stack: refreshError.stack,
                    adminId,
                    path: req.path
                });
                // Hata durumunda token'sız devam edecek ve aşağıdaki kontroller çalışacak
            }
        }
        
        // Token yoksa hata fırlat (token yenileme işlemi başarısız olmuş olabilir)
        if (!token) {
            return res.status(401).json({
                success: false,
                status: 401,
                message: "Yetkilendirme hatası: Oturum açmanız gerekiyor",
                details: "Bu işlemi gerçekleştirmek için önce giriş yapmalısınız",
                type: "AUTH_REQUIRED",
                timestamp: new Date().toISOString()
            });
        }
        
        // Token'ı doğrula
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const adminId = decoded.userId;
            
            // Redis'ten token kontrolü
            const existingToken = await redisService.get(`auth:access:${adminId}`);
            if (!existingToken || existingToken !== token) {
                // Eğer token yenilendiyse, yeni token ile devam et
                if (req.tokenRefreshed && existingToken) {
                    // Token yenilendiyse ve Redis'te başka bir token varsa bu yeni token'dır
                    // Admin bilgilerini veritabanından al
                    const admin = await Admin.findById(adminId);
                    if (!admin) {
                        return res.status(401).json({
                            success: false,
                            status: 401,
                            message: "Yönetici bulunamadı",
                            details: "Bu token ile ilişkili yönetici hesabı bulunamadı",
                            type: "ADMIN_NOT_FOUND",
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    // Admin bilgilerini req nesnesine ekle
                    req.admin = admin;
                    
                    // RequestContext'e de ekle (opsiyonel, farklı servislerde kullanım için)
                    const context = getRequestContext();
                    context.setUserId(admin._id);
                    context.setData('adminRole', admin.role);
                    context.setData('adminName', admin.name);
                    
                    next();
                    return;
                }
                
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Geçersiz veya süresi dolmuş oturum",
                    details: "Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.",
                    type: "INVALID_SESSION",
                    timestamp: new Date().toISOString()
                });
            }
            
            // Admin bilgilerini veritabanından al
            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Yönetici bulunamadı",
                    details: "Bu token ile ilişkili yönetici hesabı bulunamadı",
                    type: "ADMIN_NOT_FOUND",
                    timestamp: new Date().toISOString()
                });
            }
            
            // Admin bilgilerini req nesnesine ekle
            req.admin = admin;
            
            // RequestContext'e de ekle (opsiyonel, farklı servislerde kullanım için)
            const context = getRequestContext();
            context.setUserId(admin._id);
            context.setData('adminRole', admin.role);
            context.setData('adminName', admin.name);
            
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Token süresi dolmuşsa, adminId cookie'si ile yenileme yapmayı dene
                if (req.cookies && req.cookies.adminId) {
                    const adminId = req.cookies.adminId;
                    try {
                        // Redis'ten refresh token'ı kontrol et
                        const refreshToken = await redisService.get(`auth:refresh:${adminId}`);
                        
                        if (refreshToken) {
                            // Refresh token varsa, yeni access token üret
                            logger.info('Token expired, but adminId cookie found. Refreshing token.', { adminId });
                            
                            // Token yenileme işlemi
                            const result = await AdminAuthService.refreshAccessToken(adminId, refreshToken);
                            
                            if (result && result.accessToken) {
                                // Yeni token'ı cookie'ye ekle
                                res.cookie('accessToken', result.accessToken, {
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: 'strict',
                                    maxAge: 900000 // 15 dakika
                                });
                                
                                // Admin bilgilerini veritabanından al
                                const admin = await Admin.findById(adminId);
                                if (!admin) {
                                    return res.status(401).json({
                                        success: false,
                                        status: 401,
                                        message: "Yönetici bulunamadı",
                                        details: "Bu token ile ilişkili yönetici hesabı bulunamadı",
                                        type: "ADMIN_NOT_FOUND",
                                        timestamp: new Date().toISOString()
                                    });
                                }
                                
                                // Admin bilgilerini req nesnesine ekle
                                req.admin = admin;
                                req.tokenRefreshed = true;
                                
                                // RequestContext'e de ekle
                                const context = getRequestContext();
                                context.setUserId(admin._id);
                                context.setData('adminRole', admin.role);
                                context.setData('adminName', admin.name);
                                
                                // İşlem başarılı, devam et
                                next();
                                return;
                            }
                        }
                    } catch (refreshError) {
                        logger.error('Error refreshing expired token', {
                            error: refreshError.message,
                            stack: refreshError.stack,
                            adminId,
                            path: req.path
                        });
                    }
                }
                
                // Yenileme başarısız olursa normal hata mesajını göster
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Oturum süresi doldu",
                    details: "Erişim tokenınızın süresi doldu. Lütfen tekrar giriş yapın veya tokenı yenileyin.",
                    type: "TOKEN_EXPIRED",
                    timestamp: new Date().toISOString()
                });
            } else if (error.name === 'JsonWebTokenError') {
                logger.warn('Invalid JWT token error', {
                    error: error.message,
                    path: req.path,
                    ip: req.ip
                });
                
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Geçersiz token formatı",
                    details: `Token doğrulama hatası: ${error.message}. Lütfen tekrar giriş yapın.`,
                    errorCode: error.message,
                    type: "INVALID_TOKEN_FORMAT",
                    timestamp: new Date().toISOString()
                });
            } else {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Kimlik doğrulama hatası",
                    details: error.message,
                    type: "AUTH_ERROR",
                    timestamp: new Date().toISOString()
                });
            }
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Rol tabanlı yetkilendirme middleware'i
 * Belirli bir minimum role seviyesi gerektirir
 */
const authorizeAdmin = (minimumRole) => {
    return (req, res, next) => {
        try {
            // req.admin middleware zincirinde authAdminMiddleware'den geliyor
            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Kimlik doğrulaması yapılmadı",
                    details: "Bu işlemi yapmadan önce giriş yapmanız gerekiyor",
                    type: "NOT_AUTHENTICATED",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (req.admin.role < minimumRole) {
                return res.status(403).json({
                    success: false,
                    status: 403,
                    message: "Yetersiz yetki seviyesi",
                    details: "Bu işlemi gerçekleştirmek için yeterli yetkiye sahip değilsiniz",
                    type: "INSUFFICIENT_PERMISSIONS",
                    timestamp: new Date().toISOString()
                });
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    authAdminMiddleware,
    authorizeAdmin,
    ROLES: {
        CREATOR: 5,
        REGION_ADMIN: 4,
        CITY_ADMIN: 3,
        DISTRICT_ADMIN: 2,
        STORE_ADMIN: 1,
        STORE_WORKER: 0
    }
}; 