const eventBus = require('./eventBus.service');
const eventSchema = require('./eventSchema');
const { logger } = require('../../utils/logger');

/**
 * Event yayınlama yardımcısı
 */
module.exports = {
  /**
   * Standardize edilmiş bir olay yayınla
   * @param {string} topic - Olay konusu
   * @param {object} payload - Olay içeriği
   * @param {object} options - Ek seçenekler
   * @returns {Promise<boolean>} - Başarı durumu
   */
  async publish(topic, payload, options = {}) {
    try {
      const event = eventSchema.createEventEnvelope(topic, payload, options);
      logger.info(`Publishing event to topic: ${topic}`, { 
        eventId: event.metadata.eventId,
        correlationId: event.metadata.correlationId 
      });
      
      return await eventBus.publish(topic, event);
    } catch (error) {
      logger.error(`Error publishing event to topic: ${topic}`, { 
        error: error.message, 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  /**
   * İstek-yanıt kalıbı için bir istek gönder ve yanıt bekle
   * @param {string} requestTopic - İstek konusu
   * @param {object} requestData - İstek verisi
   * @param {object} options - Ek seçenekler
   * @returns {Promise<object>} - Yanıt verisi
   */
  async request(requestTopic, requestData, options = {}) {
    const timeout = options.timeout || 5000;
    const requestEvent = eventSchema.createRequestEvent(requestTopic, requestData, options);
    const replyTopic = requestData.replyTo || requestEvent.payload.replyTo;
    
    logger.info(`Sending request to topic: ${requestTopic}`, {
      correlationId: requestEvent.metadata.correlationId
    });
    
    // Yanıt için promise oluştur
    const responsePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
      
      // Yanıt kuyruğunu dinle
      eventBus.subscribe(replyTopic, (responseEvent) => {
        clearTimeout(timeoutId);
        
        // Yanıtın doğru olduğundan emin ol
        if (responseEvent.metadata && 
            responseEvent.metadata.correlationId === requestEvent.metadata.correlationId) {
          resolve(responseEvent.payload);
          return true; // Bu mesajı işledik, dinlemeyi durdur
        }
        return false; // Bu bizim yanıtımız değil, dinlemeye devam et
      }, { 
        exclusive: true, 
        autoDelete: true 
      });
    });
    
    // İsteği gönder
    await eventBus.publish(requestTopic, requestEvent);
    
    return responsePromise;
  }
}; 