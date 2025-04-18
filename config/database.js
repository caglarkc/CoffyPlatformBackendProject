/**
 * Database configuration file
 * Contains connection settings for Redis and MongoDB
 */

module.exports = {
  // MongoDB connection settings
  mongodb: {
    url: 'mongodb://localhost:27017',
    dbName: 'coffyDB',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Redis connection settings
  redis: {
    host: 'redis-16818.c8.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 16818,
    password: 'MhiuqV5oCNbUNmxhmFrbrMVfRv5w6RtL',
    username: 'default',
    db: 0
  },
  
  // Test database settings
  testDB: {
    url: 'mongodb://localhost:27017',
    dbName: 'coffyTestDB',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
}; 