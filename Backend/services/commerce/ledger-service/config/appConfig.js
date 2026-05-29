require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3014', 10),
  apiVersion: '1.0.0',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'baalvion',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    schema: 'ledger',
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'ledger-service',
    groupId: 'ledger-service-group',
  },

  // Auth
  auth: {
    jwksUri: process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json',
    issuer: process.env.JWT_ISSUER || 'https://identity.baalvion.io',
    audience: process.env.JWT_AUDIENCE || 'baalvion-api',
  },

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3025').split(','),

  // Feature flags
  features: {
    kafkaEvents: process.env.KAFKA_ENABLED !== 'false',
    queueWorkers: process.env.QUEUE_WORKERS !== 'false',
  },
};
