// backend/database/src/utils/database.js
'use strict';

const neo4j = require('neo4j-driver');
require('dotenv').config();

/* 
Ensure you have DB_URI, DB_USERNAME, and DB_PASSWORD set in backend/database/src/.env
*/
const driver = neo4j.driver(
  process.env.DB_URI,
  neo4j.auth.basic(process.env.DB_USERNAME, process.env.DB_PASSWORD)
);

module.exports = driver;
