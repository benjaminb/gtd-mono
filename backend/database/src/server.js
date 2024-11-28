// backend/database/src/server.js

require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const neo4jDriver = require('./utils/database');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const start = () => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

module.exports = { start };
