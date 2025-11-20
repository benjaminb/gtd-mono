// backend/database/src/server.js

require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const neo4jDriver = require('./utils/database');

// Import routes
const subscriptionRoutes = require('./routes/subscriptions');
const paymentMethodRoutes = require('./routes/paymentMethods');
const invoiceRoutes = require('./routes/invoices');
const webhookRoutes = require('./routes/webhooks');

// Webhook route needs raw body for signature verification
// Must be defined BEFORE express.json() middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Parse JSON bodies for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (configure as needed for your frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GTD API Server',
    version: '1.0.0',
  });
});

// API Routes
// Note: These routes assume authentication middleware will be added
// For now, they expect req.user to be set by authentication middleware
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/invoices', invoiceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
  });
});

const start = () => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Available routes:');
    console.log('  GET  /');
    console.log('  GET  /api/subscriptions/plans');
    console.log('  GET  /api/subscriptions/current');
    console.log('  POST /api/subscriptions/create');
    console.log('  PUT  /api/subscriptions/update');
    console.log('  POST /api/subscriptions/cancel');
    console.log('  POST /api/subscriptions/reactivate');
    console.log('  GET  /api/subscriptions/usage');
    console.log('  GET  /api/payment-methods');
    console.log('  POST /api/payment-methods');
    console.log('  DELETE /api/payment-methods/:id');
    console.log('  PUT  /api/payment-methods/:id/default');
    console.log('  GET  /api/invoices');
    console.log('  GET  /api/invoices/upcoming');
    console.log('  GET  /api/invoices/:id');
    console.log('  POST /api/webhooks/stripe');
  });
};

module.exports = { start, app };
