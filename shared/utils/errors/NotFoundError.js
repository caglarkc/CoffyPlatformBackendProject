// utils/errors/NotFoundError.js
const AppError = require('./AppError');

class NotFoundError extends AppError {
    constructor(message, details = null) {
        super(message, 404, details);
        this.name = 'NotFoundError';
    }
}

module.exports = NotFoundError;