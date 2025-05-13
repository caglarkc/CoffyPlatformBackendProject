/**
 * Admin Auth Service Database Configuration
 * Contains connection settings for MongoDB
 */

module.exports = {
  // MongoDB connection settings
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017',
    dbName: 'adminServiceDB',
    options: {
      serverSelectionTimeoutMS: 10000, // 10 saniye sonra timeout
      socketTimeoutMS: 45000, // 45 saniye sonra socket timeout
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  testDB: {
    url: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
    dbName: 'adminServiceDBTest',
    options: {
      serverSelectionTimeoutMS: 5000, // 5 saniye sonra timeout
    }
  }
}; 