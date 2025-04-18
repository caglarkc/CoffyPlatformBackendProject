// utils/errors/DatabaseError.js
    const AppError = require('./AppError');

class DatabaseError extends AppError {
    constructor(message, details = null) {
        super(message, 500, details);
        this.name = 'DatabaseError';
    }
}

module.exports = DatabaseError;