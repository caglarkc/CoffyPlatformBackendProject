const eventBus = require('./eventBus.service');
const eventSchema = require('./eventSchema');
const { logger } = require('../../utils/logger');

/**
 * Event dinleme ve işleme yardımcısı
 */
module.exports = {
  /**
   * Bir olay konusunu dinle ve işle
   * @param {string} topic - Dinlenecek olay konusu
   * @param {Function} handler - İşleyici fonksiyon (payload, metadata) => {}
   * @param {object} options - Dinleme seçenekleri
   * @returns {Promise<string>} - Oluşturulan kuyruk adı
   */
  async subscribe(topic, handler, options = {}) {
    try {
      const queueName = options.queueName || '';
      
      const wrappedHandler = async (event) => {
        try {
          // Event'in formatını kontrol et ve düzenle
          let payload = event.payload;
          let metadata = event.metadata || { topic };
          
          logger.info(`Processing event from topic: ${topic}`, {
            eventId: metadata?.eventId,
            correlationId: metadata?.correlationId
          });
          
          // İşleyiciyi çağır
          return await handler(payload, metadata);
        } catch (error) {
          logger.error(`Error handling event from topic: ${topic}`, {
            error: error.message,
            stack: error.stack,
            eventId: event.metadata?.eventId
          });
          return false; // İşleme başarısız oldu
        }
      };
      
      const result = await eventBus.subscribe(topic, wrappedHandler, options);
      
      // Subscription oluştuğunda sadece topic bilgisini logla, queueName'i loglamadan
      logger.info(`Subscribed to topic: ${topic}`);
      
      return result;
    } catch (error) {
      logger.error(`Error subscribing to topic: ${topic}`, {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },
  
  /**
   * İstek-yanıt kalıbı için istek konusunu dinle ve yanıt ver
   * @param {string} requestTopic - İstek konusu
   * @param {Function} handler - İsteği işleyip yanıt üreten fonksiyon async (requestData) => responseData
   * @param {object} options - Dinleme seçenekleri
   * @returns {Promise<string>} - Oluşturulan kuyruk adı
   */
  async respondTo(requestTopic, handler, options = {}) {
    const queueName = options.queueName || `${process.env.SERVICE_NAME}.${requestTopic}.responder`;
    
    return this.subscribe(requestTopic, async (payload, metadata) => {
      try {
        logger.info(`Processing request from topic: ${requestTopic}`, {
          correlationId: metadata.correlationId
        });
        
        // İsteği işle ve yanıt oluştur
        const responseData = await handler(payload, metadata);
        
        // Yanıt konusu belirtilmişse yanıt gönder
        if (payload.replyTo) {
          const responseEvent = eventSchema.createResponseEvent(payload.replyTo, responseData, metadata);
          
          await eventBus.publish(payload.replyTo, responseEvent);
          logger.info(`Sent response to: ${payload.replyTo}`, {
            correlationId: metadata.correlationId
          });
          return true;
        }
      } catch (error) {
        logger.error(`Error handling request from topic: ${requestTopic}`, {
          error: error.message,
          stack: error.stack
        });
        
        // Hata yanıtı gönder
        if (payload.replyTo) {
          const errorResponse = {
            success: false,
            error: error.message,
            code: error.code || 'INTERNAL_ERROR'
          };
          
          const responseEvent = eventSchema.createResponseEvent(payload.replyTo, errorResponse, metadata);
          await eventBus.publish(payload.replyTo, responseEvent);
          return true;
        }
        return false;
      }
    }, { 
      queueName, 
      durable: true, 
      ...options 
    });
  }
}; 