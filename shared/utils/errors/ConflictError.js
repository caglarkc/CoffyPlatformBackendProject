// utils/errors/ValidationError.js
const AppError = require('./AppError');
const { formatErrorMessage } = require('../stringUtils');

class ConflictError extends AppError {
    constructor(message, details = null) {
        const formattedMessage = details ? formatErrorMessage(message, details) : message;
        super(formattedMessage, 409, details);
        this.name = 'ConflictError';
    }
}

module.exports = ConflictError;