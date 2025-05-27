// backend/shared/services/event/eventBus.js
const amqp = require('amqplib');
const { logger } = require('../../utils/logger');

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.EXCHANGE_NAME = 'coffee_platform_events';
    this.connectionPromise = null;
  }

  async connect() {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:Erebus13032003_@localhost:5672';
        this.connection = await amqp.connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();
        
        // Topic exchange oluştur
        await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
        
        logger.info('Successfully connected to RabbitMQ');
        resolve(this.channel);
      } catch (error) {
        logger.error('Failed to connect to RabbitMQ', { error });
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async publish(topic, eventData) {
    try {
      if (!this.channel) await this.connect();
      
      // Event data direk olarak eventSchema tarafından formatlanmış halde gelecek
      const success = this.channel.publish(
        this.EXCHANGE_NAME,
        topic,
        Buffer.from(JSON.stringify(eventData)),
        { persistent: true } // Kalıcı mesaj olarak işaretle
      );
      
      if (success) {
        logger.info(`Event published to topic: ${topic}`, { 
          topic, 
          eventId: eventData.metadata?.eventId || 'unknown-id' 
        });
      } else {
        logger.warn(`Failed to publish event to topic: ${topic}`, { topic });
      }
      
      return success;
    } catch (error) {
      logger.error(`Error publishing event to topic: ${topic}`, { topic, error });
      throw error;
    }
  }

  async subscribe(topic, callback, options = {}) {
    try {
      if (!this.channel) await this.connect();
      
      // Queue oluştur (isim belirtilmişse o isimle, belirtilmemişse random isimle)
      const queueOptions = {
        durable: options.durable || true, // Kalıcı kuyruk (varsayılan olarak)
        exclusive: options.exclusive || false // Özel kuyruk değil (varsayılan olarak)
      };
      
      const queueName = options.queueName || '';
      const { queue } = await this.channel.assertQueue(queueName, queueOptions);
      
      // Exchange'e bağla
      await this.channel.bindQueue(queue, this.EXCHANGE_NAME, topic);
      
      // Mesajları dinle
      await this.channel.consume(queue, async (msg) => {
        if (!msg) return;
        
        try {
          const eventData = JSON.parse(msg.content.toString());
          const result = await callback(eventData, eventData.metadata);
          
          // Eğer callback true döndüyse veya void ise, mesajı onaylar
          if (result !== false) {
            this.channel.ack(msg); // Mesajı onaylayarak kuyruktan kaldır
          } else {
            // İşlem başarısız olursa mesajı tekrar kuyruğa ekle
            this.channel.nack(msg);
          }
        } catch (error) {
          logger.error(`Error processing event from topic: ${topic}`, { 
            topic, 
            error,
            content: msg.content.toString() 
          });
          
          // İşlem başarısız olursa mesajı tekrar kuyruğa ekle
          this.channel.nack(msg);
        }
      }, { noAck: false }); // Manuel onay modunu etkinleştir
      
      // Sadece topic bilgisini logla, queue bilgisini loglama
      return queue;
    } catch (error) {
      logger.error(`Error subscribing to topic: ${topic}`, { topic, error });
      throw error;
    }
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.channel = null;
    this.connection = null;
    this.connectionPromise = null;
    logger.info('Closed RabbitMQ connection');
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;