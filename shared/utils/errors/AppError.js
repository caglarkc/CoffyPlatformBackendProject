// utils/errors/AppError.js
class AppError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            status: this.statusCode,
            error: this.name,
            message: this.message,
            details: this.details,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = AppError;