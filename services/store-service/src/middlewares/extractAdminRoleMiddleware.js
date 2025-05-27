const jwt = require('jsonwebtoken');
const { getRequestContext } = require('../../../../shared/middlewares/requestContext');
const { logger } = require('../../../../shared/utils/logger');

/**
 * JWT token'dan admin rolünü çıkaran middleware
 * Admin rolünü req.adminRole olarak ekler
 */
const extractAdminRoleMiddleware = async (req, res, next) => {
    try {
        let adminRole;
        let token = null;
        
        // Authorization header'dan veya cookie'den token'ı al
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                // Token'dan admin rolünü çıkar
                adminRole = decoded.role;
                req.adminRole = adminRole;
                
                logger.debug('Admin role extracted from token', { adminRole });
            } catch (tokenError) {
                logger.warn('Token validation error', { 
                    error: tokenError.message
                });
                // Token hatası durumunda role'ü null olarak ayarla
                req.adminRole = null;
            }
        } else {
            // Token yoksa role'ü null olarak ayarla
            req.adminRole = null;
            logger.debug('No token found for role extraction');
        }
        
        // Her durumda bir sonraki middleware'e geç
        next();
    } catch (error) {
        logger.error('Error in extractAdminRoleMiddleware', { 
            error: error.message, 
            stack: error.stack
        });
        // Hata durumunda da middleware zincirini devam ettir
        next();
    }
};

module.exports = extractAdminRoleMiddleware; 