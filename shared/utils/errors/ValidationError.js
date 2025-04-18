// utils/errors/ValidationError.js
const AppError = require('./AppError');
const { formatErrorMessage } = require('../stringUtils');

class ValidationError extends AppError {
    constructor(message, details = null) {
        const formattedMessage = details ? formatErrorMessage(message, details) : message;
        super(formattedMessage, 400, details);
        this.name = 'ValidationError';
    }
}

module.exports = ValidationError;