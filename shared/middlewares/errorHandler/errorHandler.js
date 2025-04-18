const { logger } = require('../../utils/logger');

/**
 * Central error handling middleware
 */
function errorHandler(err, req, res, next) {
  // HTTP durum kodunu belirle
  const statusCode = err.statusCode || 500;
  
  // Error bilgilerini hazırla
  const errorResponse = {
    success: false,
    status: statusCode,
    message: err.message || 'Internal Server Error',
    details: err.details || null,
    type: err.type || null,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  // Hatayı logla
  if (statusCode >= 500) {
    logger.error(`${statusCode} Error:`, {
      error: err.message,
      details: err.details,
      type: err.type,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId: req.requestId
    });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} Error:`, {
      error: err.message,
      details: err.details,
      type: err.type,
      path: req.path,
      method: req.method,
      requestId: req.requestId
    });
  }
  
  // Hatayı client'a gönder
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;