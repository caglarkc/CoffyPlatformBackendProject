// utils/errors/UnauthorizedError.js
const AppError = require('./AppError');
const { formatErrorMessage } = require('../stringUtils');

class UnauthorizedError extends AppError {
    constructor(message, details = null) {
        const formattedMessage = details ? formatErrorMessage(message, details) : message;
        super(formattedMessage, 401, details);
        this.name = 'UnauthorizedError';
    }
}

module.exports = UnauthorizedError;