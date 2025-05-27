/**
 * Gateway Auth Middleware
 * Token kontrolü yaparak gateway seviyesinde güvenlik sağlar
 */

const tokenService = require('../../shared/services/token.service');
const { logger } = require('../../shared/utils/logger');

/**
 * Token kontrolü için middleware
 * Public rotalar için bypass parametresi kullanılabilir
 */
function authMiddleware(options = { bypass: false }) {
  return async (req, res, next) => {
    try {
      // Eğer bu endpoint için kimlik doğrulama atlanabilirse
      if (options.bypass) {
        return next();
      }

      // Token al ve doğrula
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Erişim tokeni bulunamadı' 
        });
      }

      // Tokenı doğrula (shared token service kullanarak)
      try {
        const decodedToken = await tokenService.verifyToken(token);
        
        // Token bilgilerini request nesnesine ekle
        req.user = {
          id: decodedToken.userId || decodedToken.adminId,
          role: decodedToken.role,
          permissions: decodedToken.permissions,
          isAdmin: !!decodedToken.adminId
        };
        
        next();
      } catch (error) {
        logger.warn('Gateway token doğrulama hatası', { 
          error: error.message,
          path: req.originalUrl
        });
        
        return res.status(401).json({ 
          success: false, 
          message: 'Geçersiz veya süresi dolmuş token' 
        });
      }
    } catch (error) {
      logger.error('Gateway auth middleware hatası', { 
        error: error.message, 
        stack: error.stack,
        path: req.originalUrl
      });
      
      return res.status(500).json({ 
        success: false, 
        message: 'Kimlik doğrulama sırasında bir hata oluştu' 
      });
    }
  };
}

module.exports = authMiddleware;
