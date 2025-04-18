const Redis = require('redis');
const { promisify } = require('util');

/**
 * Auth Service Redis Configuration
 * Contains connection settings for Redis
 */

// Redis connection settings
const redisConfig = {
  host: 'redis-16818.c8.us-east-1-4.ec2.redns.redis-cloud.com',
  port: 16818,
  password: 'MhiuqV5oCNbUNmxhmFrbrMVfRv5w6RtL',
  username: 'default',
  db: 0
};

// Redis client
let redisClient = null;

// Redis key prefixes
const keys = {
  session: 'auth:session:',
  refreshToken: 'auth:refresh:',
  user: 'auth:user:',
  rateLimit: 'auth:ratelimit:'
};

/**
 * Connect to Redis
 */
async function connect() {
  if (redisClient) {
    return redisClient;
  }

  console.log('Redis Cloud bağlantısı başlatılıyor...');
  
  const redisUrl = `redis://${redisConfig.username}:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`;
  
  // Create Redis client
  redisClient = Redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: function(retries) {
        console.log('Redis bağlantı denemesi:', retries);
        if (retries > 10) {
          return new Error('Maksimum yeniden bağlanma denemesi aşıldı');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });
  
  // Event listeners
  redisClient.on('connect', () => {
    console.log('Redis Cloud bağlantısı başarılı');
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis Cloud bağlantı hatası:', err);
  });
  
  redisClient.on('ready', () => {
    console.log('Redis Cloud kullanıma hazır');
  });
  
  redisClient.on('end', () => {
    console.log('Redis Cloud bağlantısı kapandı');
  });
  
  // Start connection
  await redisClient.connect().catch(console.error);
  
  return redisClient;
}

/**
 * Disconnect from Redis
 */
async function disconnect() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Auth Service] Redis connection closed');
  }
}

// Promise-based Redis methods
const getAsync = async (key) => {
  const client = await connect();
  return client.get(key);
};

const setAsync = async (key, value, expireTime) => {
  const client = await connect();
  await client.set(key, value);
  if (expireTime) {
    await client.expire(key, expireTime);
  }
  return 'OK';
};

const delAsync = async (key) => {
  const client = await connect();
  return client.del(key);
};

const existsAsync = async (key) => {
  const client = await connect();
  return client.exists(key);
};

module.exports = {
  redisClient: () => redisClient,
  connect,
  disconnect,
  keys,
  getAsync,
  setAsync,
  delAsync,
  existsAsync
};