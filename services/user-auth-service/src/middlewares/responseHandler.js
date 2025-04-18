/**
 * Response Intercept Middleware
 * Yanıtları işleyerek, token yenileme bilgisini ekler
 */
const responseHandlerMiddleware = (req, res, next) => {
    // Orijinal res.json metodu
    const originalJson = res.json;
    
    // res.json metodunu override et
    res.json = function(obj) {
        // Token yenilendiyse, yanıta bilgiyi ekle
        if (req.tokenRefreshed && obj && typeof obj === 'object' && !obj.error && res.statusCode >= 200 && res.statusCode < 300) {
            obj.tokenRefreshed = true;
            obj.authMessage = "Oturumunuz otomatik olarak yenilendi";
        }
        
        // Orijinal json metodunu çağır
        return originalJson.call(this, obj);
    };
    
    next();
};

module.exports = responseHandlerMiddleware; 