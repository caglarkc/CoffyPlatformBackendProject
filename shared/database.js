/**
 * Shared Database Connection Module
 * Provides MongoDB and Redis connections for all microservices
 */

const mongoose = require('mongoose');
const Redis = require('redis');
const { logger } = require('./utils/logger');

// MongoDB connection
let mongoClient;
let redisClient;

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffy-platform';
    
    // MongoDB bağlantı seçenekleri
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    // Docker ortamında çalışırken bağlantı denemelerini artır
    if (process.env.NODE_ENV === 'development' && process.env.MONGODB_URI?.includes('@mongodb:')) {
      options.serverSelectionTimeoutMS = 30000; // 30 saniye
      options.connectTimeoutMS = 30000;
    }
    
    mongoClient = await mongoose.connect(uri, options);
    
    logger.info('MongoDB connection established successfully');
    return mongoClient;
  } catch (error) {
    logger.error('MongoDB connection error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Connect to Redis
 */
async function connectRedis() {
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = Redis.createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => {
          // Docker ortamında çalışırken bağlantı denemelerini artır
          if (process.env.NODE_ENV === 'development' && url.includes('redis:')) {
            return Math.min(retries * 100, 3000); // Her denemede bekleyecek süre (max 3 saniye)
          }
          return Math.min(retries * 50, 1000); // Standart strateji
        }
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis client error:', { error: err.message });
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
    
    await redisClient.connect();
    
    logger.info('Redis connection established successfully');
    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Close all database connections
 */
async function closeConnections() {
  try {
    if (mongoClient) {
      await mongoose.disconnect();
      logger.info('MongoDB connection closed');
    }
    
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Export database connection functions
module.exports = { 
  connectMongoDB,
  connectRedis,
  closeConnections
}; 