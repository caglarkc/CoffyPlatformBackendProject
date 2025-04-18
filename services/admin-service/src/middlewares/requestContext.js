// middleware/requestContext.js
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();
const axios = require('axios');
const { logger } = require('../../../../shared/utils/logger');

class RequestContext {
    constructor(req) {
        this.ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
        this.userId = null;
        this.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.timestamp = new Date().toISOString();
        this.method = req.method;
        this.path = req.path;
        this.userAgent = req.get('user-agent');
        this.data = new Map();
    }

    setUserId(userId) {
        this.userId = userId;
    }

    setData(key, value) {
        this.data.set(key, value);
    }

    getData(key) {
        return this.data.get(key);
    }
}

const requestContextMiddleware = async (req, res, next) => {
    try {
        const context = new RequestContext(req);
        
        // Attach context to request for easy access
        req.context = context;
        
        logger.debug("illk", {
            adminId: req.cookies.adminId,
            path: req.path
        });

        // Otomatik token yenileme kontrolü
        // Access token yoksa ve adminId cookie'si varsa token yenileme işlemi
        if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) && 
            (!req.cookies || !req.cookies.accessToken) && 
            req.cookies && req.cookies.adminId) {
            logger.debug("burada", {
                adminId: req.cookies.adminId,
                path: req.path
            });
            try {
                const adminId = req.cookies.adminId;
                
                logger.info('Attempting to refresh token in requestContext middleware', { 
                    adminId, 
                    path: req.path
                });
                
                // Admin-auth-service'e istek at ve cookie refresh işlemini başlat
                // Doğru endpoint: /api/admin-auth (!)
                const authServiceUrl = process.env.ADMIN_AUTH_SERVICE_URL || 'http://localhost:3002';
                
                const response = await axios.get(`${authServiceUrl}/api/admin-auth/cookie-refresh`, { 
                    params: { adminId },
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Service-Call': 'admin-service',
                        // Cookie'yi başlıkta da gönder
                        'Cookie': `adminId=${adminId}`
                    },
                    // CORS sorunlarını gidermek için withCredentials ekliyoruz
                    withCredentials: true
                });
                
                if (response.data && response.status === 200) {
                    // Response'dan accessToken'ı alıp manuel olarak cookie'ye ekleyelim
                    // Çünkü service to service isteklerde cookie'ler otomatik olarak ayarlanmaz
                    if (response.data.accessToken) {
                        res.cookie('accessToken', response.data.accessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict',
                            maxAge: 900000 // 15 dakika
                        });
                        
                        // Token başarıyla yenilendi
                        logger.info('Token successfully refreshed in requestContext middleware', { 
                            adminId, 
                            path: req.path,
                            expiresAt: response.data.expiresAt
                        });
                        
                        // requestRefreshed bayrağını ekle
                        req.tokenRefreshed = true;
                    } else {
                        logger.warn('No accessToken in refresh response', { 
                            adminId, 
                            responseData: JSON.stringify(response.data)
                        });
                    }
                } else {
                    logger.warn('Unexpected response from auth service', { 
                        status: response.status,
                        data: JSON.stringify(response.data) 
                    });
                }
            } catch (error) {
                logger.error('Error refreshing token in requestContext middleware', { 
                    error: error?.message || 'Unknown error', 
                    stack: error?.stack,
                    path: req.path
                });
                // Hata durumunda devam et, middleware zincirini kesme
            }
        }
        
        // Run the middleware with context
        asyncLocalStorage.run(context, () => {
            next();
        });
    } catch (error) {
        console.error('Error in requestContext middleware:', error);
        next(error);
    }
};

const getRequestContext = () => {
    try {
        const context = asyncLocalStorage.getStore();
        if (!context) {
            console.warn('Request context is not available, creating a default context');
            return {
                ip: '127.0.0.1',
                userId: null,
                requestId: 'default-' + Date.now(),
                timestamp: new Date().toISOString(),
                method: 'UNKNOWN',
                path: 'UNKNOWN',
                userAgent: 'UNKNOWN',
                data: new Map()
            };
        }
        return context;
    } catch (error) {
        console.error('Error in getRequestContext:', error);
        return {
            ip: '127.0.0.1',
            userId: null,
            requestId: 'error-' + Date.now(),
            timestamp: new Date().toISOString(),
            method: 'ERROR',
            path: 'ERROR',
            userAgent: 'ERROR',
            data: new Map()
        };
    }
};

module.exports = {
    requestContextMiddleware,
    getRequestContext,
    RequestContext
};