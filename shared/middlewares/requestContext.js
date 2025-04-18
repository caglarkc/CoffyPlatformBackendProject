// middleware/requestContext.js
const { AsyncLocalStorage } = require('async_hooks');
const asyncLocalStorage = new AsyncLocalStorage();

class RequestContext {
    constructor(req) {
        this.ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
        this.userId = null;
        this.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.timestamp = new Date().toISOString();
        this.method = req.method;
        this.path = req.path;
        this.userAgent = req.get('user-agent');
        this.data = new Map();
    }

    setUserId(userId) {
        this.userId = userId;
    }

    setData(key, value) {
        this.data.set(key, value);
    }

    getData(key) {
        return this.data.get(key);
    }
}

const requestContextMiddleware = (req, res, next) => {
    try {
        const context = new RequestContext(req);
        
        // Attach context to request for easy access
        req.context = context;
        
        // Run the middleware with context
        asyncLocalStorage.run(context, () => {
            next();
        });
    } catch (error) {
        console.error('Error in requestContext middleware:', error);
        next(error);
    }
};

const getRequestContext = () => {
    try {
        const context = asyncLocalStorage.getStore();
        if (!context) {
            console.warn('Request context is not available, creating a default context');
            return {
                ip: '127.0.0.1',
                userId: null,
                requestId: 'default-' + Date.now(),
                timestamp: new Date().toISOString(),
                method: 'UNKNOWN',
                path: 'UNKNOWN',
                userAgent: 'UNKNOWN',
                data: new Map()
            };
        }
        return context;
    } catch (error) {
        console.error('Error in getRequestContext:', error);
        return {
            ip: '127.0.0.1',
            userId: null,
            requestId: 'error-' + Date.now(),
            timestamp: new Date().toISOString(),
            method: 'ERROR',
            path: 'ERROR',
            userAgent: 'ERROR',
            data: new Map()
        };
    }
};

module.exports = {
    requestContextMiddleware,
    getRequestContext,
    RequestContext
};