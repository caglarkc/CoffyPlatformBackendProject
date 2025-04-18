const AppError = require('./AppError');
const { formatErrorMessage } = require('../stringUtils');


class RedisError extends AppError {
    constructor(message) {
        const formattedMessage = formatErrorMessage(message, null);
        super(formattedMessage, 500);
        this.name = 'RedisError';
    }
}

module.exports = RedisError; 