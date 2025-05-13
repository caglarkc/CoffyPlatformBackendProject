const Redis = require('redis');
const { promisify } = require('util');

/**
 * Auth Service Redis Configuration
 * Contains connection settings for Redis
 */

// Redis key prefixes
const keys = {
  session: 'auth:session:',
  refreshToken: 'auth:refresh:',
  user: 'auth:user:',
  rateLimit: 'auth:ratelimit:'
};

// Redis client
let redisClient = null;

/**
 * Connect to Redis
 * @param {string} customUrl - Optional custom Redis URL
 */
async function connect(customUrl = null) {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // Docker veya yerel ortam için Redis URL'sini belirle
  const redisUrl = customUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  
  console.log('Redis bağlantısı başlatılıyor:', redisUrl);
  
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
    console.log('Redis bağlantısı başarılı');
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis bağlantı hatası:', err);
  });
  
  redisClient.on('ready', () => {
    console.log('Redis kullanıma hazır');
  });
  
  redisClient.on('end', () => {
    console.log('Redis bağlantısı kapandı');
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
    console.log('Redis connection closed');
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