// Load environment variables first
require('dotenv').config(); // Önce lokal .env'yi yükle
require('dotenv').config({ path: '../../../.env', override: false }); // Eksik değerler için ana .env'yi yükle

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {requestContextMiddleware} = require('../../../shared/middlewares/requestContext');
const errorHandler = require('../../../shared/middlewares/errorHandler/errorHandler');
const {logger , httpLogger} = require('../../../shared/utils/logger');
const eventBus = require('../../../shared/services/event/eventBus.service');
const storeService = require('./services/store.service');
const keyRotationService = require('../../../shared/services/security/keyRotation.service');
const { initializeMongooseConnections } = require('./utils/mongooseConnections');

// Import routes
const storeRoutes = require('./routes/store.routes');

const { 
  connectMongoDB, 
  closeConnections,
  connectRedis,
  getAuthDb
} = require('./utils/database');

// Create Express application
const app = express();
const PORT = process.env.STORE_SERVICE_PORT || 3005; // Store service port

// CORS middleware - Frontend'in 3000 portundan isteklere izin ver
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// HTTP request logger middleware
app.use(httpLogger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestContextMiddleware);

// Register routes
app.use('/api/v1/store', storeRoutes);

// Error middleware - tüm route'lardan sonra eklenmelidir
app.use(errorHandler);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    service: 'Store Service',
    status: 'running',
    message: 'Store Service is running with MongoDB and Redis connections' 
  });
});

// Initialize event bus and listeners
async function initializeEventBus() {
  try {
    await eventBus.connect();
    logger.info('EventBus connection established successfully');
    
    // Initialize event listeners for admin service
    await storeService.initializeEventListeners();
    logger.info('Store service event listeners initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize EventBus', { error: error.message, stack: error.stack });
  }
}

// Initialize database connections
async function initializeDatabases() {
  try {
    // Connect to MongoDB - store veritabanı (varsayılan)
    await connectMongoDB();

    // Connect to Redis
    await connectRedis();
    
    // Auth veritabanına bağlan (admin, user ve log verileri)
    await getAuthDb();
    
    // Mongoose bağlantılarını başlat
    await initializeMongooseConnections();
    
    logger.info('All database connections established successfully');
  } catch (error) {
    logger.error('Failed to initialize databases', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Initialize key rotation
function initializeKeyRotation() {
  try {
    // Schedule key rotation every 12 hours
    const keyRotationJob = keyRotationService.scheduleKeyRotation('0 */12 * * *');
    
    logger.info('Key rotation service initialized successfully');
    
    // Generate initial key if it doesn't exist
    if (!process.env.SECRET_KEY) {
      logger.warn('No SECRET_KEY found, generating initial key...');
      keyRotationService.updateSecretKey()
        .then(() => logger.info('Initial SECRET_KEY generated successfully'))
        .catch(err => logger.error('Failed to generate initial SECRET_KEY', { error: err.message }));
    }
    
    return keyRotationJob;
  } catch (error) {
    logger.error('Failed to initialize key rotation service', { error: error.message, stack: error.stack });
    return null;
  }
}

// Start the server
async function startServer() {
  try {
    // Initialize database connections first
    await initializeDatabases();
    
    // Initialize key rotation service
    const keyRotationJob = initializeKeyRotation();
    
    await initializeEventBus();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Handle application shutdown
    process.on('SIGINT', async () => {
      logger.info('Application shutting down...');
      if (keyRotationJob) {
        keyRotationJob.stop();
        logger.info('Key rotation service stopped');
      }
      await eventBus.close();
      await closeConnections();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Application shutting down...');
      if (keyRotationJob) {
        keyRotationJob.stop();
        logger.info('Key rotation service stopped');
      }
      await eventBus.close();
      await closeConnections();
      process.exit(0);
    });
    
    // Beklenmeyen hatalar için global error handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason: reason.message, stack: reason.stack });
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    await closeConnections();
    process.exit(1);
  }
}

// Start the application only if not being required (imported) by another module (like tests)
if (require.main === module) {
  startServer();
}

// Export the app for testing
module.exports = app;
