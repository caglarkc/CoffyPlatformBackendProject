const { v4: uuidv4 } = require('uuid');

/**
 * Olay yapısını standardize eden yardımcı fonksiyonlar
 */
module.exports = {
  // Yeni bir olay zarfı oluştur
  createEventEnvelope(topic, payload, options = {}) {
    return {
      topic,
      payload,
      metadata: {
        eventId: options.eventId || uuidv4(),
        timestamp: options.timestamp || new Date().toISOString(),
        sourceService: process.env.SERVICE_NAME || 'unknown-service',
        correlationId: options.correlationId || uuidv4(),
        version: options.version || '1.0'
      }
    };
  },
  
  // İstek olayı oluştur
  createRequestEvent(topic, data, options = {}) {
    const requestId = options.requestId || uuidv4();
    const replyTopic = `${process.env.SERVICE_NAME || 'service'}.reply.${requestId}`;
    
    return this.createEventEnvelope(topic, {
      ...data,
      replyTo: replyTopic
    }, {
      correlationId: requestId,
      ...options
    });
  },
  
  // Yanıt olayı oluştur
  createResponseEvent(replyTopic, data, requestMetadata) {
    return this.createEventEnvelope(replyTopic, data, {
      correlationId: requestMetadata.correlationId,
      responseToEventId: requestMetadata.eventId
    });
  }
}; 