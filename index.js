/**
 * Main application entry point
 * Initializes database connections and starts the server
 */

const express = require('express');
const { 
  connectMongoDB, 
  connectRedis, 
  closeConnections 
} = require('./shared/database');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connections
async function initializeDatabases() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    
    // Connect to Redis
    await connectRedis();
    
    console.log('All database connections established successfully');
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  try {
    // Initialize database connections first
    await initializeDatabases();
    
    // Basic route for testing
    app.get('/', (req, res) => {
      res.json({ message: 'Server is running with MongoDB and Redis connections' });
    });
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle application shutdown
    process.on('SIGINT', async () => {
      console.log('Application shutting down...');
      await closeConnections();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Application shutting down...');
      await closeConnections();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    await closeConnections();
    process.exit(1);
  }
}

// Start the application
startServer(); 