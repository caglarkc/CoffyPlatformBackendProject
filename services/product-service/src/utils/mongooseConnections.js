/**
 * Mongoose bağlantılarını yöneten yardımcı modül
 * authServiceDB: users, admins ve logs koleksiyonları
 * storeServiceDB: mağaza verileri
 */
const mongoose = require('mongoose');
const config = require('../config/database');
const { logger } = require('../../../../shared/utils/logger');

// Mongoose bağlantılarını saklayacak obje
const connections = {
  default: mongoose.connection, // Varsayılan bağlantı (storeServiceDB)
  auth: null, // Auth veritabanı bağlantısı (authServiceDB)
};

/**
 * Auth veritabanına Mongoose bağlantısı sağlar (admins, users ve logs)
 * @returns {mongoose.Connection} Mongoose bağlantısı
 */
function getAuthConnection() {
  if (!connections.auth) {
    const uri = `${config.auth.url}/${config.auth.dbName}`;
    connections.auth = mongoose.createConnection(uri, config.auth.options);
    
    connections.auth.on('connected', () => {
      logger.info(`[Store Service] Auth DB Mongoose connection established at ${uri}`);
    });
    
    connections.auth.on('error', (err) => {
      logger.error('[Store Service] Auth DB Mongoose connection error:', { error: err.message, stack: err.stack });
    });
    
    connections.auth.on('disconnected', () => {
      logger.warn('[Store Service] Auth DB Mongoose connection disconnected');
    });
  }
  
  return connections.auth;
}

function getStoreConnection() {
  if (!connections.store) {
    const uri = `${config.store.url}/${config.store.dbName}`;
    connections.store = mongoose.createConnection(uri, config.store.options);
    
    connections.store.on('connected', () => {
      logger.info(`[Store Service] Store DB Mongoose connection established at ${uri}`);
    });
    
    connections.store.on('error', (err) => {
      logger.error('[Store Service] Store DB Mongoose connection error:', { error: err.message, stack: err.stack });
    });
    
    connections.store.on('disconnected', () => {
      logger.warn('[Store Service] Store DB Mongoose connection disconnected');
    });
  }
  
  return connections.store;
}

/**
 * Store veritabanına Mongoose bağlantısı sağlar (mağaza verileri)
 * @returns {mongoose.Connection} Mongoose bağlantısı
 */
function getStoreConnection() {
  // Varsayılan bağlantı zaten storeServiceDB için kurulmuş durumda
  return connections.default;
}

/**
 * Tüm Mongoose bağlantılarını başlatır
 */
async function initializeMongooseConnections() {
  // Varsayılan bağlantı zaten database.js içinden başlatılıyor (storeServiceDB)
  
  // Auth veritabanı bağlantısını başlat (users, admins ve logs için)
  getAuthConnection();
  getStoreConnection();

  logger.info('[Product Service] All Mongoose connections initialized');
}

/**
 * Tüm Mongoose bağlantılarını kapatır
 */
async function closeMongooseConnections() {
  for (const key in connections) {
    if (connections[key] && connections[key] !== mongoose.connection) {
      await connections[key].close();
      logger.info(`[Product Service] ${key} Mongoose connection closed`);
    }
  }
}

module.exports = {
  getAuthConnection,
  getStoreConnection,
  initializeMongooseConnections,
  closeMongooseConnections
}; 