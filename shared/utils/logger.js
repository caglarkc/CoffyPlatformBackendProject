const winston = require('winston');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Log dizinini oluştur (yoksa)
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom log formatı
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
    return `${timestamp} [${service}] ${level.toUpperCase()}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Console transport için renkli format
const colorizedFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
    return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Logger oluştur
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: process.env.SERVICE_NAME },
  format: logFormat,
  transports: [
    // Error seviyesindeki logları ayrı dosyaya yaz
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // HTTP isteklerini ayrı dosyaya yaz
    new winston.transports.File({ 
      filename: path.join(logDir, 'http.log'), 
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Tüm logları combined.log dosyasına yaz
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ]
});

// Geliştirme ortamında konsola da log yaz
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: colorizedFormat
  }));
}

// Express.js ile kullanılabilecek HTTP request logger middleware
const httpLogger = (req, res, next) => {
  const startTime = new Date().getTime();
  
  // Response tamamlandığında log yaz
  res.on('finish', () => {
    const duration = new Date().getTime() - startTime;
    
    logger.http(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      userAgent: req.get('user-agent'),
      duration: `${duration}ms`,
      requestId: req.requestId || 'unknown'
    });
  });
  
  next();
};

module.exports = {
  logger,
  httpLogger
}; 