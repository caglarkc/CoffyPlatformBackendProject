/**
 * Admin Service Database Connection Module
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
      // Docker ortamı için MongoDB bağlantı URL'sini doğrudan kullan
      const mongoUrl = process.env.MONGODB_URI || config.mongodb.url;
      console.log('[Admin Service] Using MongoDB URL:', mongoUrl);
      
      // Debug için bağlantı bilgilerini gösterelim
      console.log('[Admin Service] MongoDB Config:', JSON.stringify({
        url: mongoUrl,
        dbName: config.mongodb.dbName,
        options: config.mongodb.options
      }));
      
      // MongoClient bağlantısı
      mongoClient = new MongoClient(mongoUrl, config.mongodb.options);
      await mongoClient.connect();
      mongoDb = mongoClient.db(config.mongodb.dbName);
      
      // Mongoose bağlantısı
      await mongoose.connect(`${mongoUrl}/${config.mongodb.dbName}`, config.mongodb.options);
      
      console.log('[Admin Service] MongoDB connection established successfully');
    }
    return mongoDb;
  } catch (error) {
    console.error('[Admin Service] MongoDB connection error:', error);
    
    // Burada hatayı fırlatmak yerine, null dönüyoruz
    // Böylece uygulama MongoDB olmadan da çalışmaya devam edebilir
    console.warn('[Admin Service] Continuing without MongoDB. Some features will be limited.');
    return null;
  }
}

/**
 * Initialize Redis connection
 */
async function connectRedis() {
  try {
    // Docker ortamı için Redis URL'sini kullan
    const redisUrl = process.env.REDIS_URL || 'redis://host.docker.internal:6379';
    console.log('[Admin Service] Using Redis URL:', redisUrl);
    
    await redis.connect(redisUrl);
    return redis.redisClient();
  } catch (error) {
    console.error('[Admin Service] Redis connection error:', error);
    console.warn('[Admin Service] Continuing without Redis. Some features will be limited.');
    return null;
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
      console.log('[Admin Service] MongoDB connection closed');
    }
    
    // Mongoose bağlantısını kapat
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[Admin Service] Mongoose connection closed');
    }
    
    await redis.disconnect();
  } catch (error) {
    console.error('[Admin Service] Error closing database connections:', error);
  }
}

// MongoDB Collection Helpers
const getCollection = (collectionName) => {
  if (!mongoDb) {
    console.warn(`[Admin Service] MongoDB connection not established, cannot get collection ${collectionName}`);
    return {
      find: () => ({ toArray: () => Promise.resolve([]) }),
      findOne: () => Promise.resolve(null),
      insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
      updateOne: () => Promise.resolve({ modifiedCount: 0 }),
      deleteOne: () => Promise.resolve({ deletedCount: 0 })
    };
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