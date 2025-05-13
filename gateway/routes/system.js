/**
 * Sistem Rotaları
 * API Gateway'in sistem ve yönetim endpointlerini içerir
 */

const express = require('express');
const { logger } = require('../../shared/utils/logger');
const services = require('../config/services');
const router = express.Router();

// Sistem durumu endpoint'i
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    gateway: {
      status: 'running',
      version: process.env.VERSION || '1.0.0',
      env: process.env.NODE_ENV || 'development'
    },
    services: Object.keys(services).map(key => ({
      name: key,
      address: services[key]
    }))
  });
});

// Servis bilgileri endpoint'i
router.get('/services', (req, res) => {
  res.status(200).json({
    services: Object.keys(services).map(key => ({
      name: key,
      address: services[key]
    }))
  });
});

// Basit bir ping endpoint'i
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' });
});

module.exports = router; 