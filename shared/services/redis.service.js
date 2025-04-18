const { getAsync, setAsync, delAsync, existsAsync } = require('../config/redis');
const RedisError = require('../utils/errors/RedisError');

class RedisService {
    /**
     * Redis'ten bir anahtarın değerini alır
     * @param {string} key - Alınacak anahtarın adı
     * @returns {Promise<any>} - Anahtarın değeri
     */
    static async get(key) {
        try {
            const value = await getAsync(key);
            if (!value) return null;

            try {
                return JSON.parse(value);
            } catch {
                return value; // Eğer JSON parse edilemezse string olarak döndür
            }
        } catch (error) {
            throw new RedisError('Redis veri okuma hatası: ' + error.message);
        }
    }

    /**
     * Redis'e bir anahtar-değer çifti kaydeder
     * @param {string} key - Kaydedilecek anahtarın adı
     * @param {any} value - Kaydedilecek değer
     * @param {number} expireTime - Anahtarın süresinin dolması için gereken saniye (varsayılan: 3600)
     * @returns {Promise<string>} - Redis'in yanıtı (genellikle 'OK')
     */
    static async put(key, value, expireTime = 3600) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const result = await setAsync(key, stringValue, expireTime);
            return result;
        } catch (error) {
            throw new RedisError('Redis veri kaydetme hatası: ' + error.message);
        }
    }

    /**
     * Redis'ten bir anahtarı siler
     * @param {string} key - Silinecek anahtarın adı
     * @returns {Promise<number>} - Silinen anahtar sayısı
     */
    static async delete(key) {
        try {
            const result = await delAsync(key);
            return result;
        } catch (error) {
            throw new RedisError('Redis veri silme hatası: ' + error.message);
        }
    }

    /**
     * Redis'te bir anahtarın var olup olmadığını kontrol eder
     * @param {string} key - Kontrol edilecek anahtarın adı
     * @returns {Promise<boolean>} - Anahtarın var olup olmadığı
     */
    static async exists(key) {
        try {
            const result = await existsAsync(key);
            return result === 1;
        } catch (error) {
            throw new RedisError('Redis kontrol hatası: ' + error.message);
        }
    }
}

module.exports = RedisService; 