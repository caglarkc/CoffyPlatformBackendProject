/**
 * Swagger Yapılandırması
 * API Gateway'in Swagger dokümantasyonunu oluşturur
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const { logger } = require('../../shared/utils/logger');
const services = require('./services');

// Swagger için ara router
const swaggerSetup = express.Router();

// Mikroservislerin swagger dokümantasyonunu toplama
let combinedSwaggerSpecs = {
  openapi: '3.0.0',
  info: {
    title: 'Coffy Platform API',
    version: '1.0.0',
    description: 'Coffy Platform tüm mikroservis API Dokümantasyonu'
  },
  servers: [
    {
      url: '/api',
      description: 'API Gateway'
    }
  ],
  paths: {},
  components: {
    schemas: {},
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

/**
 * Mikroservislerin Swagger dokümantasyonunu alır ve birleştirir
 */
async function getSpecs() {
  try {
    const serviceEndpoints = [
      { name: 'admin-auth', url: `http://${services['admin-auth-service']}/admin-auth/api-docs/swagger.json` },
      { name: 'admin', url: `http://${services['admin-service']}/admin/api-docs/swagger.json` },
      { name: 'user-auth', url: `http://${services['user-auth-service']}/auth/api-docs/swagger.json` }
    ];
    
    logger.info('Retrieving Swagger specs from microservices...');
    
    for (const service of serviceEndpoints) {
      try {
        logger.info(`Fetching Swagger spec from ${service.name}...`);
        const timeout = 3000; // 3 seconds timeout
        const response = await axios.get(service.url, { timeout });
        const serviceSpec = response.data;
        
        // Endpoints'leri prefix ile birleştir
        if (serviceSpec.paths) {
          Object.keys(serviceSpec.paths).forEach(path => {
            const newPath = path.startsWith('/') 
              ? `/api/${service.name}${path}` 
              : `/api/${service.name}/${path}`;
            
            combinedSwaggerSpecs.paths[newPath] = serviceSpec.paths[path];
          });
        }
        
        // Şemaları birleştir
        if (serviceSpec.components && serviceSpec.components.schemas) {
          Object.keys(serviceSpec.components.schemas).forEach(schema => {
            combinedSwaggerSpecs.components.schemas[`${service.name}_${schema}`] = 
              serviceSpec.components.schemas[schema];
          });
        }
        
        logger.info(`Successfully integrated ${service.name} Swagger spec`);
      } catch (error) {
        logger.warn(`Could not fetch Swagger spec from ${service.name}: ${error.message}`);
      }
    }
    
    // Statik dokümantasyonu kaydet
    const swaggerOutputPath = path.join(__dirname, '..', 'swagger-combined.json');
    fs.writeFileSync(swaggerOutputPath, JSON.stringify(combinedSwaggerSpecs, null, 2));
    logger.info(`Combined Swagger documentation saved to ${swaggerOutputPath}`);
    
    // SwaggerUI için route handler
    swaggerSetup.get('/swagger.json', (req, res) => {
      res.json(combinedSwaggerSpecs);
    });
    
    return combinedSwaggerSpecs;
  } catch (error) {
    logger.error('Error retrieving Swagger specs', { error });
    throw error;
  }
}

module.exports = {
  getSpecs,
  swaggerUi,
  swaggerSetup
}; 