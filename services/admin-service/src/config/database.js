/**
 * Admin Auth Service Database Configuration
 * Contains connection settings for MongoDB
 */

module.exports = {
  // MongoDB connection settings
  mongodb: {
    url: 'mongodb://localhost:27017',
    dbName: 'adminServiceDB',
    options: {
      serverSelectionTimeoutMS: 5000, // 5 saniye sonra timeout
      socketTimeoutMS: 45000, // 45 saniye sonra socket timeout
    }
  },
  testDB: {
    url: 'mongodb://localhost:27017',
    dbName: 'adminServiceDBTest',
    options: {
      serverSelectionTimeoutMS: 5000, // 5 saniye sonra timeout
    }
  }
}; 