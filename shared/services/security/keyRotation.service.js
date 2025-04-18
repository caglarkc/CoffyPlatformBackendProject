const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const cron = require('node-cron');
const dotenv = require('dotenv');

class KeyRotationService {
  constructor() {
    this.envPath = path.resolve(process.cwd(), '.env');
    this.backupPath = path.resolve(process.cwd(), '.env.backup');
  }

  /**
   * Generates a new random secret key
   * @returns {string} Newly generated secret key
   */
  generateSecretKey() {
    // Generate a random 64 character hex string
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Reads the current .env file
   */
  async readEnvFile() {
    try {
      const data = await fs.readFile(this.envPath, 'utf8');
      return data;
    } catch (error) {
      console.error('Error reading .env file:', error);
      throw error;
    }
  }

  /**
   * Creates a backup of the .env file
   */
  async backupEnvFile() {
    try {
      const data = await this.readEnvFile();
      await fs.writeFile(this.backupPath, data, 'utf8');
      console.log('Backup of .env file created successfully');
    } catch (error) {
      console.error('Error creating backup of .env file:', error);
      throw error;
    }
  }

  /**
   * Updates the SECRET_KEY in the .env file
   */
  async updateSecretKey() {
    try {
      // Backup the current .env file
      await this.backupEnvFile();

      // Read the current .env file
      let envContent = await this.readEnvFile();

      // Generate a new secret key
      const newSecretKey = this.generateSecretKey();

      // Check if SECRET_KEY already exists in the .env file
      if (envContent.includes('SECRET_KEY=')) {
        // Replace the existing SECRET_KEY
        envContent = envContent.replace(
          /SECRET_KEY=.*/,
          `SECRET_KEY=${newSecretKey}`
        );
      } else {
        // Add the SECRET_KEY if it doesn't exist
        envContent += `\nSECRET_KEY=${newSecretKey}`;
      }

      // Write the updated content back to the .env file
      await fs.writeFile(this.envPath, envContent, 'utf8');

      // Reload environment variables
      dotenv.config();

      console.log('SECRET_KEY updated successfully');
      
      // Return the timestamp of the rotation
      return {
        timestamp: new Date().toISOString(),
        message: 'SECRET_KEY rotated successfully'
      };
    } catch (error) {
      console.error('Error updating SECRET_KEY:', error);
      throw error;
    }
  }

  /**
   * Schedules the key rotation job
   * @param {string} cronExpression - Cron expression for scheduling (default: every 12 hours)
   */
  scheduleKeyRotation(cronExpression = '0 */12 * * *') {
    console.log(`Key rotation scheduled with cron: ${cronExpression}`);
    
    // Schedule the job using node-cron
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log('Executing scheduled key rotation...');
        await this.updateSecretKey();
        console.log('Scheduled key rotation completed successfully');
      } catch (error) {
        console.error('Error during scheduled key rotation:', error);
      }
    });

    return job;
  }
}

module.exports = new KeyRotationService(); 