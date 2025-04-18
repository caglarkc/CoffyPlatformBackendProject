// utils/errors/ValidationError.js
const AppError = require('./AppError');
const { formatErrorMessage } = require('../stringUtils');

class ForbiddenError extends AppError {
    constructor(message, details = null) {
        const formattedMessage = details ? formatErrorMessage(message, details) : message;
        super(formattedMessage, 403, details);
        this.name = 'ForbiddenError';
    }
}

module.exports = ForbiddenError;