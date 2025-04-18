const textUtils = require('../../../../shared/utils/textUtils');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const errorMessages = require('../../../../shared/config/errorMessages');
const { logger } = require('../../../../shared/utils/logger');
const { NOW, FORMAT_EXPIRES_AT } = require('../../../../shared/utils/constants/time');

const validateRegister = (data) => {
    textUtils.validateName(data.name);
    textUtils.validateSurname(data.surname);
    textUtils.validateEmail(data.email);
    textUtils.validatePhone(data.phone);
    textUtils.validatePassword(data.password);
}

const validateSendEmailVerifyToken = (isActive, verificationTokenExpiresAt) => {
    if (isActive === "verified") {
        throw new ForbiddenError(errorMessages.FORBIDDEN.ACCOUNT_ALREADY_VERIFIED);
    }
    //21:00 da yollandıysa, 1 dk geçmesi lazım yeni token yollanabilmeis için, yani 21:05 de expire olucak, 21:01 de yollanabilcek o da expire - 4 oluyor 
    //yani zaman şuan 21:01den sonra ise yollanabilir yani eger expires tam - 4 ten büyük olması lazım şuanın

    // Token oluşturulduktan sonra en az 1 dakika geçmiş olmalı
    const canResendAt = verificationTokenExpiresAt - 4 * 60 * 1000; // expire - 4dk = gönderildiği zamandan 1dk sonrası
    if ( NOW < canResendAt) {
        throw new ForbiddenError(errorMessages.TOKEN.TOKEN_CANT_SEND_TIME);
    }
    
}


const validateLoginToken = (isLoggedIn, loginTokenExpiresAt) => {
    if (isLoggedIn) {
        throw new ForbiddenError(errorMessages.FORBIDDEN.USER_ALREADY_LOGGED_IN);
    }
    const canResendAt = loginTokenExpiresAt - 4 * 60 * 1000; // expire - 4dk = gönderildiği zamandan 1dk sonrası
    if ( NOW < canResendAt) {
        throw new ForbiddenError(errorMessages.TOKEN.TOKEN_CANT_SEND_TIME);
    }

    
    
}   

const validateUser = (user) => {
    if (!user) {
        throw new NotFoundError(errorMessages.NOT_FOUND.USER_NOT_FOUND);
    }
}



module.exports = {
    validateRegister,
    validateSendEmailVerifyToken,
    validateUser,
    validateLoginToken
}

