const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const errorMessages = require('../../../../shared/config/errorMessages');
const { logger } = require('../../../../shared/utils/logger');

/**
 * Admin rolünü kontrol eden middleware
 * @param {Number} requiredRole - Gereken minimum rol seviyesi
 * @returns {Function} Middleware fonksiyonu
 */
const checkRole = (requiredRole) => {
    return (req, res, next) => {
        try {
            // adminRole token'dan çıkarıldı ve extractAdminIdMiddleware tarafından eklendi
            if (req.adminRole === undefined || req.adminRole === null) {
                logger.warn('Role check failed: No role found in request', {
                    path: req.path,
                    requiredRole,
                    adminId: req.adminId || 'unknown'
                });
                throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
            }

            if (req.adminRole < requiredRole) {
                logger.warn('Role check failed: Insufficient permissions', {
                    path: req.path,
                    requiredRole,
                    userRole: req.adminRole,
                    adminId: req.adminId
                });
                throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
            }

            logger.debug('Role check passed', {
                path: req.path,
                requiredRole,
                userRole: req.adminRole,
                adminId: req.adminId
            });

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = checkRole; 