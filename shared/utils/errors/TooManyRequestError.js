// utils/errors/TooManyRequestError.js
const AppError = require('./AppError');
const { formatErrorMessage } = require('../stringUtils');

class TooManyRequestError extends AppError {
    constructor(message, details = null) {
        const formattedMessage = details ? formatErrorMessage(message, details) : message;
        super(formattedMessage, 429, details);
        this.name = 'TooManyRequestError';
    }
}

module.exports = TooManyRequestError;