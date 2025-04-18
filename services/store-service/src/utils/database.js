/**
 * Store Service Database Connection Module
 * Handles connections to Redis and MongoDB
 */

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const config = require('../config/database');
const redis = require('../../../../shared/config/redis');
const { logger } = require('../../../../shared/utils/logger');

// MongoDB connections
let connections = {
  default: { client: null, db: null }, // storeServiceDB
  auth: { client: null, db: null }     // authServiceDB
};

/**
 * Initialize MongoDB connection (storeServiceDB)
 */
async function connectMongoDB() {
  try {
    if (!connections.default.client) {
      // Store MongoDB bağlantısı (bu servis için varsayılan)
      connections.default.client = new MongoClient(config.mongodb.url, config.mongodb.options);
      await connections.default.client.connect();
      connections.default.db = connections.default.client.db(config.mongodb.dbName);
      
      // Mongoose bağlantısı (varsayılan - storeServiceDB)
      await mongoose.connect(`${config.mongodb.url}/${config.mongodb.dbName}`, config.mongodb.options);
      
      logger.info('[Store Service] MongoDB connection (storeServiceDB) established successfully');
    }
    return connections.default.db;
  } catch (error) {
    logger.error('[Store Service] MongoDB connection error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Auth veritabanına bağlantı sağlar (authServiceDB - admin, user ve log verileri)
 */
async function connectToAuthDB() {
  try {
    if (!connections.auth.client) {
      connections.auth.client = new MongoClient(config.auth.url, config.auth.options);
      await connections.auth.client.connect();
      connections.auth.db = connections.auth.client.db(config.auth.dbName);
      logger.info('[Store Service] Auth DB connection (authServiceDB) established successfully');
    }
    return connections.auth.db;
  } catch (error) {
    logger.error('[Store Service] Auth DB connection error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Initialize Redis connection
 */
async function connectRedis() {
  try {
    await redis.connect();
    return redis.redisClient();
  } catch (error) {
    logger.error('[Store Service] Redis connection error:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Close database connections
 */
async function closeConnections() {
  try {
    // Tüm veritabanı bağlantılarını kapat
    for (const key in connections) {
      if (connections[key].client) {
        await connections[key].client.close();
        connections[key].client = null;
        connections[key].db = null;
        logger.info(`[Store Service] ${key} MongoDB connection closed`);
      }
    }
    
    // Mongoose bağlantısını kapat
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('[Store Service] Mongoose connection closed');
    }
    
    await redis.disconnect();
  } catch (error) {
    logger.error('[Store Service] Error closing database connections:', { error: error.message, stack: error.stack });
    throw error;
  }
}

// MongoDB Collection Helpers
const getCollection = (collectionName, dbName = 'default') => {
  if (!connections[dbName] || !connections[dbName].db) {
    throw new Error(`[Store Service] MongoDB ${dbName} connection not established`);
  }
  return connections[dbName].db.collection(collectionName);
};

// Veritabanı bağlantılarını sağlayan yardımcı fonksiyonlar
const getAuthDb = async () => {
  if (!connections.auth.db) {
    await connectToAuthDB();
  }
  return connections.auth.db;
};

module.exports = {
  connectMongoDB,
  connectRedis,
  connectToAuthDB,
  closeConnections,
  // Veritabanı bağlantıları
  getMongoDb: () => connections.default.db,
  getAuthDb,
  // Collection yardımcıları  
  getCollection,
  // Redis client
  getRedisClient: () => redis.redisClient(),
  // Redis key helpers
  keys: redis.keys
}; 