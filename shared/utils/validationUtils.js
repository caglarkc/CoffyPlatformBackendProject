const textUtils = require('./textUtils');
const NotFoundError = require('../utils/errors/NotFoundError');
const ForbiddenError = require('../utils/errors/ForbiddenError');
const errorMessages = require('../config/errorMessages');
const { logger } = require('../utils/logger');

const validateCreateStore = (data) => {
    textUtils.validateName(data.name);
    textUtils.validateStoreId(data.storeId);
    textUtils.validateLocation(data.region);
    textUtils.validateLocation(data.city);
    textUtils.validateLocation(data.district);
    
}

const validateAdminWithPermission = (admin, needLevel) => {
    if (!admin) {
        throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
    }
    if (admin.role < needLevel) {
        throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
    }
}

const validateAdmin = (admin) => {
    if (!admin) {
        throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
    }
}

const validateAdminRegister = (data, loggedAdminRole) => {
    try {
        if (loggedAdminRole <= data.role) {
            logger.warn('Admin registration failed - insufficient permissions', { 
                creatorRole: loggedAdminRole, 
                attemptedRole: data.role 
            });
            throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
        }
        
        textUtils.validateName(data.name);
        textUtils.validateSurname(data.surname);
        textUtils.validateEmail(data.email);
        textUtils.validatePhone(data.phone);
        textUtils.validatePassword(data.password);
        textUtils.validateRole(data.role);
        if (data.location) {
            textUtils.validateLocation(data.location.city);
            textUtils.validateLocation(data.location.region);
            textUtils.validateLocation(data.location.district);
            textUtils.validateStoreId(data.location.storeId);
        }
        
        return true; // Tüm doğrulamalar başarılı
    } catch (error) {
        // Hata oluştuğunda loglama yap
        logger.warn(`Admin registration validation failed: ${error.message}`, {
            errorType: error.constructor.name,
            errorMessage: error.message,
            validationField: getFailedValidationField(error),
            adminData: {
                email: data.email,
                role: data.role,
                creatorRole: loggedAdminRole
            }
        });
        
        // Hatayı tekrar fırlat
        throw error;
    }
}

// Hatanın hangi doğrulama alanından geldiğini tespit etmeye çalışan yardımcı fonksiyon
const getFailedValidationField = (error) => {
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('name')) return 'name';
    if (errorMsg.includes('surname')) return 'surname';
    if (errorMsg.includes('email')) return 'email';
    if (errorMsg.includes('phone')) return 'phone';
    if (errorMsg.includes('password')) return 'password';
    if (errorMsg.includes('role')) return 'role';
    if (errorMsg.includes('city') || errorMsg.includes('region') || 
        errorMsg.includes('district')) return 'location';
    if (errorMsg.includes('storeid')) return 'storeId';
    
    return 'unknown';
}

module.exports = {
    validateCreateStore,
    validateAdminWithPermission,
    validateAdmin,
    validateAdminRegister
}
