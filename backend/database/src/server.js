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
    message: 'GTD Task Management API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      tasks: '/api/tasks'
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/property-schemas', propertySchemaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

const start = () => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`API endpoints:`);
    console.log(`  - Users: http://localhost:${port}/api/users`);
    console.log(`  - Tasks: http://localhost:${port}/api/tasks`);
  });
};

const close = async () => {
  await neo4jDriver.close();
  console.log('Database connection closed');
};

module.exports = { start, close };
