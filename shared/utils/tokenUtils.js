const jwt = require('jsonwebtoken');

const createAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN });
};

const createRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });
};

const verifyToken = (token, isRefreshToken = false) => {
    try {
        return jwt.verify(token, isRefreshToken ? process.env.REFRESH_TOKEN_SECRET : process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            error.isExpired = true;
        }
        throw error;
    }
};

// Token'ın süresinin dolmasına ne kadar kaldığını kontrol et
const checkTokenExpiration = (token) => {
    try {
        const decoded = jwt.decode(token);
        const expirationTime = decoded.exp * 1000; // Unix timestamp'i milisaniyeye çevir
        const currentTime = Date.now();
        return expirationTime - currentTime; // Kalan süre (ms)
    } catch (error) {
        return 0;
    }
};

// Token'ın yenilenmesi gerekip gerekmediğini kontrol et
const shouldRefreshToken = (token) => {
    const timeUntilExpiration = checkTokenExpiration(token);
    const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 dakika
    return timeUntilExpiration > 0 && timeUntilExpiration < REFRESH_THRESHOLD;
};

module.exports = {
    createAccessToken,
    createRefreshToken,
    verifyToken,
    checkTokenExpiration,
    shouldRefreshToken
};