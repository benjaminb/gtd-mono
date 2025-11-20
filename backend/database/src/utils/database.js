// backend/database/src/utils/database.js
'use strict';

const neo4j = require('neo4j-driver');
require('dotenv').config();

/*
Ensure you have NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD set in backend/database/.env
*/
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

module.exports = driver;
