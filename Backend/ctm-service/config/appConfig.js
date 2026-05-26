'use strict';
require('dotenv').config();

module.exports = {
  port:       Number(process.env.PORT || 3011),
  env:        process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  serviceName:'ctm-service',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3025').split(',').map(s => s.trim()),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
  },

  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT || 5432),
    name:     process.env.DB_NAME     || 'baalvion_db',
    user:     process.env.DB_USER     || 'baalvion',
    password: process.env.DB_PASSWORD || '',
  },

  rateLimit: {
    windowMs: 60_000,
    max:      Number(process.env.RATE_LIMIT_IP_MAX || 120),
  },
};
