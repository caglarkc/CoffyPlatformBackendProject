const jwt = require('jsonwebtoken');
const { getRequestContext } = require('../../../../shared/middlewares/requestContext');
const { logger } = require('../../../../shared/utils/logger');
const redisService = require('../../../../shared/services/redis.service');
const axios = require('axios');

/**
 * Token, cookie veya request context'ten admin ID'yi çıkaran middleware
 * Admin ID'yi req.adminId olarak ekler
 */
const extractAdminIdMiddleware = async (req, res, next) => {
    try {
        let adminId;
        let authSource = null; // Kimlik doğrulama kaynağını tutacak değişken
        
        // Öncelikle token yoksa ama adminId cookie'si varsa token yenileme işlemini dene
        if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) && 
            (!req.cookies || !req.cookies.accessToken) && 
            req.cookies && req.cookies.adminId) {
            
            try {
                // AdminId cookie'sinden ID'yi al
                const cookieAdminId = req.cookies.adminId;
                
                // Admin-auth-service'e istek at ve token'ı yenile
                const authServiceUrl = process.env.ADMIN_AUTH_SERVICE_URL || 'http://localhost:3002';
                
                logger.info('Trying to refresh token from adminId cookie', { 
                    adminId: cookieAdminId,
                    path: req.path
                });
                
                const response = await axios.get(`${authServiceUrl}/api/admin-auth/cookie-refresh`, { 
                    params: { adminId: cookieAdminId },
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Service-Call': 'admin-service',
                        // Cookie'yi başlıkta da gönder
                        'Cookie': `adminId=${cookieAdminId}`
                    },
                    withCredentials: true // CORS sorununu gidermek için
                });
                
                if (response.data && response.status === 200) {
                    // Eğer token response'da varsa manuel olarak cookie'ye ekle
                    if (response.data.accessToken) {
                        res.cookie('accessToken', response.data.accessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 900000 // 15 dakika
                        });
                        
                        // Log bilgisi
                        logger.info('Access token automatically refreshed via auth service', { 
                            adminId: cookieAdminId, 
                            requestPath: req.path, 
                            source: 'extractAdminIdMiddleware',
                            refreshed: true
                        });
                        
                        // adminId'yi ayarla ve devam et
                        adminId = cookieAdminId;
                        authSource = 'auto_refresh';
                        
                        // Yanıt tamamlandıktan sonra kullanıcıya bilgi verme
                        req.tokenRefreshed = true;
                    } else {
                        logger.warn('Cookie refresh succeeded but no accessToken in response', {
                            adminId: cookieAdminId,
                            response: JSON.stringify(response.data)
                        });
                    }
                }
            } catch (error) {
                logger.error('Error refreshing token in extractAdminIdMiddleware', { 
                    error: error?.message || 'Unknown error', 
                    stack: error?.stack,
                    path: req.path
                });
                // Token yenileme hatası, normal akışa devam et
            }
        }
        
        // Eğer token yenileme başarılı olduysa burada adminId zaten tanımlanmış olacak
        if (!adminId) {
            // 1. Öncelikle request nesnesine eklenmiş admin bilgisine bak
            if (req.admin && req.admin._id) {
                adminId = req.admin._id;
                authSource = 'req.admin';
                logger.debug('Admin ID extracted from req.admin', { adminId });
            } 
            // 2. Token'dan admin ID'yi çıkarmayı dene
            else {
                let token = null;
                let refreshToken = null;
                
                // Authorization header'dan veya cookie'den token'ı al
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.split(' ')[1];
                    authSource = 'authorization_header';
                    logger.debug('Token extracted from Authorization header');
                } else if (req.cookies && req.cookies.accessToken) {
                    token = req.cookies.accessToken;
                    authSource = 'cookie';
                    logger.debug('Token extracted from cookie');
                    logger.debug('Token', { token });
                }
                
                // Refresh token'ı da al
                if (req.cookies && req.cookies.refreshToken) {
                    refreshToken = req.cookies.refreshToken;
                    logger.debug('Refresh token found in cookies');
                } else if (req.body && req.body.refreshToken) {
                    refreshToken = req.body.refreshToken;
                    logger.debug('Refresh token found in request body');
                }
                
                if (token) {
                    try {
                        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                        adminId = decoded.userId;
                        logger.debug('Admin ID extracted from token', { adminId, authSource });
                    } catch (tokenError) {
                        // Token hatasının tipi
                        const tokenErrorType = tokenError.name;
                        
                        // TokenExpiredError durumunda adminId cookie'si kullanarak token yenileme dene
                        if (tokenErrorType === 'TokenExpiredError') {
                            logger.warn('Access token expired', { 
                                error: tokenError.message,
                                authSource,
                                path: req.path
                            });
                            
                            // AdminId cookie'si var mı?
                            if (req.cookies && req.cookies.adminId) {
                                try {
                                    // AdminId cookie'sinden ID'yi al
                                    const cookieAdminId = req.cookies.adminId;
                                    
                                    // Admin-auth-service'e istek at ve token'ı yenile
                                    const authServiceUrl = process.env.ADMIN_AUTH_SERVICE_URL || 'http://localhost:3002';
                                    
                                    logger.info('Token expired but adminId cookie found, trying to refresh', { 
                                        adminId: cookieAdminId,
                                        path: req.path
                                    });
                                    
                                    const response = await axios.get(`${authServiceUrl}/api/admin-auth/cookie-refresh`, { 
                                        params: { adminId: cookieAdminId },
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-Service-Call': 'admin-service',
                                            // Cookie'yi başlıkta da gönder
                                            'Cookie': `adminId=${cookieAdminId}`
                                        },
                                        withCredentials: true // CORS sorununu gidermek için
                                    });
                                    
                                    if (response.data && response.status === 200) {
                                        // Eğer token service-to-service iletişim için response'da döndürülmüşse manuel ayarla
                                        if (response.data.accessToken) {
                                            res.cookie('accessToken', response.data.accessToken, {
                                                httpOnly: true,
                                                secure: process.env.NODE_ENV === 'production',
                                                sameSite: 'strict',
                                                maxAge: 900000 // 15 dakika
                                            });
                                            
                                            // Token başarıyla yenilendi
                                            logger.info('Expired access token automatically refreshed', { 
                                                adminId: cookieAdminId, 
                                                requestPath: req.path,
                                                refreshed: true
                                            });
                                            
                                            // adminId'yi ayarla ve devam et
                                            adminId = cookieAdminId;
                                            authSource = 'token_refresh';
                                            
                                            // Yanıt tamamlandıktan sonra kullanıcıya bilgi verme
                                            req.tokenRefreshed = true;
                                        } else {
                                            logger.warn('Cookie refresh succeeded but no accessToken in response', {
                                                adminId: cookieAdminId,
                                                response: JSON.stringify(response.data)
                                            });
                                        }
                                    }
                                } catch (refreshError) {
                                    logger.error('Error refreshing expired token', { 
                                        error: refreshError?.message || 'Unknown error', 
                                        stack: refreshError?.stack,
                                        path: req.path
                                    });
                                    
                                    // Token yenileme başarısız oldu, devam et ve normal hata mesajlarını döndür
                                    // Refresh token var mı?
                                    if (refreshToken) {
                                        req.authError = {
                                            type: 'access_token_expired',
                                            message: 'Oturum süresi dolmuş. Refresh token ile yenilenebilir.',
                                            hasRefreshToken: true,
                                            source: authSource
                                        };
                                    } else {
                                        // Redis'te refresh token kontrolü yap
                                        try {
                                            // Önce token'dan ID'yi çekmeye çalış
                                            let userId = null;
                                            try {
                                                const decodedExpired = jwt.decode(token);
                                                if (decodedExpired && decodedExpired.userId) {
                                                    userId = decodedExpired.userId;
                                                }
                                            } catch (decodeErr) {
                                                logger.warn('Failed to decode expired token', { error: decodeErr.message });
                                            }
                                            
                                            if (userId) {
                                                // Redis'te refresh token kontrol et
                                                const redisRefreshKey = `refreshToken:${userId}`;
                                                const hasRedisRefreshToken = await redisService.exists(redisRefreshKey);
                                                
                                                if (hasRedisRefreshToken) {
                                                    logger.info('Refresh token found in Redis for user', { userId });
                                                    req.authError = {
                                                        type: 'access_token_expired_redis_refresh',
                                                        message: 'Oturum süresi dolmuş. Refresh token mevcut, oturumunuzu yenileyebilirsiniz.',
                                                        userId,
                                                        hasRedisRefreshToken: true,
                                                        source: authSource
                                                    };
                                                } else {
                                                    req.authError = {
                                                        type: 'access_token_expired_no_refresh',
                                                        message: 'Oturum süresi dolmuş ve yenileme tokeni bulunamadı. Yeniden giriş yapmalısınız.',
                                                        hasRefreshToken: false,
                                                        source: authSource
                                                    };
                                                }
                                            } else {
                                                req.authError = {
                                                    type: 'access_token_expired_no_refresh',
                                                    message: 'Oturum süresi dolmuş ve yenileme tokeni bulunamadı. Yeniden giriş yapmalısınız.',
                                                    hasRefreshToken: false,
                                                    source: authSource
                                                };
                                            }
                                        } catch (redisError) {
                                            logger.error('Error checking Redis for refresh token', { 
                                                error: redisError.message, 
                                                stack: redisError.stack
                                            });
                                            
                                            req.authError = {
                                                type: 'access_token_expired_no_refresh',
                                                message: 'Oturum süresi dolmuş ve yenileme tokeni bulunamadı. Yeniden giriş yapmalısınız.',
                                                hasRefreshToken: false,
                                                source: authSource
                                            };
                                        }
                                    }
                                }
                            } else {
                                // AdminId cookie'si yok, normal hata akışına devam et
                                if (refreshToken) {
                                    req.authError = {
                                        type: 'access_token_expired',
                                        message: 'Oturum süresi dolmuş. Refresh token ile yenilenebilir.',
                                        hasRefreshToken: true,
                                        source: authSource
                                    };
                                } else {
                                    // Redis'te refresh token kontrolü yap
                                    try {
                                        // Önce token'dan ID'yi çekmeye çalış
                                        let userId = null;
                                        try {
                                            const decodedExpired = jwt.decode(token);
                                            if (decodedExpired && decodedExpired.userId) {
                                                userId = decodedExpired.userId;
                                            }
                                        } catch (decodeErr) {
                                            logger.warn('Failed to decode expired token', { error: decodeErr.message });
                                        }
                                        
                                        if (userId) {
                                            // Redis'te refresh token kontrol et
                                            const redisRefreshKey = `refreshToken:${userId}`;
                                            const hasRedisRefreshToken = await redisService.exists(redisRefreshKey);
                                            
                                            if (hasRedisRefreshToken) {
                                                logger.info('Refresh token found in Redis for user', { userId });
                                                req.authError = {
                                                    type: 'access_token_expired_redis_refresh',
                                                    message: 'Oturum süresi dolmuş. Refresh token mevcut, oturumunuzu yenileyebilirsiniz.',
                                                    userId,
                                                    hasRedisRefreshToken: true,
                                                    source: authSource
                                                };
                                            } else {
                                                req.authError = {
                                                    type: 'access_token_expired_no_refresh',
                                                    message: 'Oturum süresi dolmuş ve yenileme tokeni bulunamadı. Yeniden giriş yapmalısınız.',
                                                    hasRefreshToken: false,
                                                    source: authSource
                                                };
                                            }
                                        } else {
                                            req.authError = {
                                                type: 'access_token_expired_no_refresh',
                                                message: 'Oturum süresi dolmuş ve yenileme tokeni bulunamadı. Yeniden giriş yapmalısınız.',
                                                hasRefreshToken: false,
                                                source: authSource
                                            };
                                        }
                                    } catch (redisError) {
                                        logger.error('Error checking Redis for refresh token', { 
                                            error: redisError.message, 
                                            stack: redisError.stack
                                        });
                                        
                                        req.authError = {
                                            type: 'access_token_expired_no_refresh',
                                            message: 'Oturum süresi dolmuş ve yenileme tokeni bulunamadı. Yeniden giriş yapmalısınız.',
                                            hasRefreshToken: false,
                                            source: authSource
                                        };
                                    }
                                }
                            }
                        } else if (tokenErrorType === 'JsonWebTokenError') {
                            logger.warn('Invalid token format', { 
                                error: tokenError.message,
                                authSource,
                                path: req.path
                            });
                            
                            req.authError = {
                                type: 'invalid_token_format',
                                message: 'Geçersiz oturum formatı. Yeniden giriş yapmalısınız.',
                                source: authSource
                            };
                        } else {
                            logger.warn('Token verification failed', { 
                                error: tokenError.message,
                                errorType: tokenErrorType,
                                authSource,
                                path: req.path
                            });
                            
                            req.authError = {
                                type: 'token_verification_failed',
                                message: 'Oturum doğrulanamadı. Yeniden giriş yapmalısınız.',
                                source: authSource
                            };
                        }
                    }
                } else {
                    // Token bulunamadı ama adminId cookie'si varsa otomatik token yenileme yap
                    if (req.cookies && req.cookies.adminId) {
                        try {
                            // AdminId cookie'sinden ID'yi al
                            const cookieAdminId = req.cookies.adminId;
                            
                            // Admin-auth-service'e istek at ve token'ı yenile
                            const authServiceUrl = process.env.ADMIN_AUTH_SERVICE_URL || 'http://localhost:3002';
                            
                            logger.info('No token but adminId cookie found, trying to refresh', { 
                                adminId: cookieAdminId,
                                path: req.path
                            });
                            
                            const response = await axios.get(`${authServiceUrl}/api/admin-auth/cookie-refresh`, { 
                                params: { adminId: cookieAdminId },
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Service-Call': 'admin-service',
                                    // Cookie'yi başlıkta da gönder
                                    'Cookie': `adminId=${cookieAdminId}`
                                },
                                withCredentials: true // CORS sorununu gidermek için
                            });
                            
                            if (response.data && response.status === 200) {
                                // Eğer token service-to-service iletişim için response'da döndürülmüşse manuel ayarla
                                if (response.data.accessToken) {
                                    res.cookie('accessToken', response.data.accessToken, {
                                        httpOnly: true,
                                        secure: process.env.NODE_ENV === 'production',
                                        sameSite: 'strict',
                                        maxAge: 900000 // 15 dakika
                                    });
                                    
                                    // Token başarıyla yenilendi
                                    logger.info('Access token created from adminId cookie', { 
                                        adminId: cookieAdminId, 
                                        requestPath: req.path,
                                        refreshed: true
                                    });
                                    
                                    // adminId'yi ayarla ve devam et
                                    adminId = cookieAdminId;
                                    authSource = 'token_refresh';
                                    
                                    // Token yenilendi işareti
                                    req.tokenRefreshed = true;
                                } else {
                                    logger.warn('Cookie refresh succeeded but no accessToken in response', {
                                        adminId: cookieAdminId,
                                        response: JSON.stringify(response.data)
                                    });
                                }
                            }
                        } catch (refreshError) {
                            logger.error('Error creating token from adminId cookie', { 
                                error: refreshError?.message || 'Unknown error', 
                                stack: refreshError?.stack,
                                path: req.path
                            });
                            
                            // Devam edilecek, normal token kontrolüne dön
                        }
                    }
                    
                    // Token yenileme başarısız olduysa veya adminId cookie'si yoksa normal akışa devam et
                    if (!adminId) {
                        // Eğer request'te kullanıcı ID'si ipucu varsa
                        let potentialUserId = null;
                        
                        if (req.body && req.body.userId) {
                            potentialUserId = req.body.userId;
                        } else if (req.params && req.params.userId) {
                            potentialUserId = req.params.userId;
                        } else if (req.query && req.query.userId) {
                            potentialUserId = req.query.userId;
                        }
                        
                        // Redis'te refresh token kontrolü yap
                        if (potentialUserId) {
                            const redisRefreshKey = `refreshToken:${potentialUserId}`;
                            const hasRedisRefreshToken = await redisService.exists(redisRefreshKey);
                            
                            if (hasRedisRefreshToken) {
                                logger.info('No access token, but refresh token found in Redis', { userId: potentialUserId });
                                req.authError = {
                                    type: 'no_token_redis_refresh_available',
                                    message: 'Oturum bilgisi bulunamadı fakat yenileme tokeni mevcut. Oturumunuzu yenileyebilirsiniz.',
                                    userId: potentialUserId,
                                    hasRedisRefreshToken: true,
                                    source: 'redis'
                                };
                                return next();
                            }
                        }
                        
                        // Token, adminId cookie'si ve Redis'te refresh token bulunamadı
                        req.authError = {
                            type: 'no_token_found',
                            message: 'Kimlik doğrulama tokeni bulunamadı. Lütfen giriş yapın.',
                            hasRefreshToken: !!refreshToken,
                            path: req.path
                        };
                    }
                }
            }
        }
        
        // 3. RequestContext'ten admin ID'yi çıkarmayı dene
        if (!adminId) {
            try {
                const context = getRequestContext();
                adminId = context.userId;
                
                if (adminId) {
                    authSource = 'request_context';
                    logger.debug('Admin ID extracted from request context', { adminId });
                }
            } catch (contextError) {
                logger.warn('Failed to extract admin ID from request context', { 
                    error: contextError.message,
                    stack: contextError.stack
                });
            }
        }
        
        // Admin ID'yi request'e ekle
        if (adminId) {
            req.adminId = adminId;
            
            // Otomatik yenilendiyse bunu next() öncesi kullanılabilir yapalım
            if (req.tokenRefreshed) {
                req.customAuthMessage = "Oturumunuz otomatik olarak yenilendi";
            }
        } else {
            // Hata mesajı
            req.customAuthErrorMessage = req.authError ? req.authError.message : 'Yetkilendirme bilgisi bulunamadı';
        }
        
        // Her zaman middleware zincirini devam ettir
        next();
    } catch (error) {
        logger.error('Error in extractAdminIdMiddleware', { 
            error: error.message,
            stack: error.stack,
            path: req.path
        });
        
        // Hata durumunda da middleware zincirini devam ettir
        next();
    }
};

module.exports = extractAdminIdMiddleware; 
