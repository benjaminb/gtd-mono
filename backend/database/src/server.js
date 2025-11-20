// backend/database/src/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const neo4jDriver = require('./utils/database');

// Import routes
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const suggestionRoutes = require('./routes/suggestions');
const propertySchemaRoutes = require('./routes/propertySchemas');
const analyticsRoutes = require('./routes/analytics');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentMethodRoutes = require('./routes/paymentMethods');
const invoiceRoutes = require('./routes/invoices');
const webhookRoutes = require('./routes/webhooks');

// Webhook route needs raw body for signature verification
// Must be defined BEFORE express.json() middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
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
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/property-schemas', propertySchemaRoutes);
app.use('/api/analytics', analyticsRoutes);
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
    console.log('  POST /api/users - Register user');
    console.log('  POST /api/users/login - Login');
    console.log('  GET  /api/users/:id/tasks - Get user tasks');
    console.log('  GET  /api/tasks');
    console.log('  POST /api/tasks');
    console.log('  POST /api/tasks/search - Search with filters');
    console.log('  GET  /api/property-schemas');
    console.log('  POST /api/property-schemas');
    console.log('  GET  /api/analytics/*');
    console.log('  POST /api/suggestions/*');
  });
};

module.exports = { start, app };
