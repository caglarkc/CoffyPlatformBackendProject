/**
 * Auth Service Database Connection Module
 * Handles connections to Redis and MongoDB
 */

const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const config = require('../config/database');
const redis = require('../../../../shared/config/redis');

// MongoDB connection
let mongoClient = null;
let mongoDb = null;

/**
 * Initialize MongoDB connection
 */
async function connectMongoDB() {
  try {
    if (!mongoClient) {
      // MongoClient bağlantısı
      mongoClient = new MongoClient(config.mongodb.url, config.mongodb.options);
      await mongoClient.connect();
      mongoDb = mongoClient.db(config.mongodb.dbName);
      
      // Mongoose bağlantısı
      await mongoose.connect(`${config.mongodb.url}/${config.mongodb.dbName}`, config.mongodb.options);
      
      console.log('[Auth Service] MongoDB connection established successfully');
    }
    return mongoDb;
  } catch (error) {
    console.error('[Auth Service] MongoDB connection error:', error);
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
    console.error('[Auth Service] Redis connection error:', error);
    throw error;
  }
}

/**
 * Close database connections
 */
async function closeConnections() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      mongoDb = null;
      console.log('[Auth Service] MongoDB connection closed');
    }
    
    // Mongoose bağlantısını kapat
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Auth Service] Mongoose connection closed');
    }
    
    await redis.disconnect();
  } catch (error) {
    console.error('[Auth Service] Error closing database connections:', error);
    throw error;
  }
}

// MongoDB Collection Helpers
const getCollection = (collectionName) => {
  if (!mongoDb) {
    throw new Error('[Auth Service] MongoDB connection not established');
  }
  return mongoDb.collection(collectionName);
};

module.exports = {
  connectMongoDB,
  connectRedis,
  closeConnections,
  getMongoDb: () => mongoDb,
  getRedisClient: () => redis.redisClient(),
  getCollection,
  // Redis key helpers
  keys: redis.keys
}; 