const { 
    createAccessToken, 
    createRefreshToken, 
    verifyToken,
    shouldRefreshToken
} = require('../utils/tokenUtils');
const UnauthorizedError = require('../utils/errors/UnauthorizedError');
const errorMessages = require('../config/errorMessages');
class TokenService {
    async verifyAndDecodeToken(token, isRefreshToken = false) {
        try {
            

            // Token'ı doğrula
            const decoded = verifyToken(token, isRefreshToken);

            // Otomatik yenileme kontrolü
            if (!isRefreshToken && shouldRefreshToken(token)) {
                const newAccessToken = createAccessToken(decoded.userId);
                return {
                    decoded,
                    newAccessToken
                };
            }

            return { decoded };
        } catch (error) {
            if (error.isExpired) {
                throw new UnauthorizedError(errorMessages.TOKEN.TOKEN_EXPIRED);
            }
            throw error;
        }
    }


    createTokenPair(userId) {
        return {
            accessToken: createAccessToken(userId),
            refreshToken: createRefreshToken(userId)
        };
    }
}

module.exports = new TokenService(); 