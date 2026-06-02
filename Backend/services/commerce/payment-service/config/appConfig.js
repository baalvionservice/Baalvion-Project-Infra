require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3015', 10),
  apiVersion: '1.0.0',
  version: process.env.SERVICE_VERSION || '1.0.0',

  // ── @baalvion/sdk platform wiring (the ONLY integration layer) ──
  // payment-service is a CONSUMER of the CMS vault: provider + keys are resolved
  // per-tenant through sdk.config (→ CMS internal resolver). NO provider keys in
  // env here — only the inter-service secret + the hub URL.
  service: 'payment-service',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret',
  cmsBaseUrl: process.env.CMS_BASE_URL || 'http://localhost:3018/api/v1',
  eventTransport: process.env.EVENT_TRANSPORT || 'noop',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'baalvion',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    schema: 'payments',
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
    db: parseInt(process.env.REDIS_DB || '1', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: 'payment-service',
    groupId: 'payment-service-group',
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

  // Payment limits
  limits: {
    dailyPerAccount: process.env.DAILY_LIMIT || '1000000', // 10,000 USD in cents
    transactionMax: process.env.TX_MAX_LIMIT || '500000', // 5,000 USD per transaction
    transactionMin: process.env.TX_MIN_LIMIT || '100', // 1 USD minimum
  },

  // Fee configuration
  fees: {
    percentageFee: parseFloat(process.env.FEE_PERCENTAGE || '0.01'), // 0.01%
    flatFee: parseInt(process.env.FEE_FLAT || '50', 10), // 50 cents
    vatRate: parseFloat(process.env.VAT_RATE || '0.05'), // 5% VAT
  },

  // Idempotency
  idempotency: {
    ttl: parseInt(process.env.IDEMPOTENCY_TTL || '86400', 10), // 24 hours in seconds
  },
};

// Fail fast in production if the shared inter-service secret (used by sdk.internalAuth
// to guard the gateway create/read API and to authenticate to the CMS vault) was
// left at the insecure development default.
if (
  module.exports.env === 'production' &&
  (!process.env.INTERNAL_SERVICE_SECRET || module.exports.internalSecret === 'baalvion-internal-dev-secret')
) {
  throw new Error('[payment-service] INTERNAL_SERVICE_SECRET must be set in production — refusing to start with the dev default');
}
