const express = require('express');
const router = express.Router();
// Authentication removed for simplified access

// Debug info (only for development)
router.get('/info', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Debug routes only available in development' });
    }
    
    const debugInfo = {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json(debugInfo);
  } catch (error) {
    console.error('Error fetching debug info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test database connection
router.get('/db', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ message: 'Debug routes only available in development' });
    }
    
    const mongoose = require('mongoose');
    
    const dbStatus = {
      connected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
    
    res.json(dbStatus);
  } catch (error) {
    console.error('Error checking database:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test routes
router.get('/test', (req, res) => {
  res.json({
    message: 'Debug route working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;