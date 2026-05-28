'use strict';
require('dotenv').config();

// Parse comma-separated ALLOWED_ORIGINS env var
const defaultOrigins = [
  'http://localhost:3024',
  'http://localhost:3025',
  'http://localhost:3026',
  'http://localhost:3027',
  'http://localhost:3028',
  'http://localhost:3029',
  'http://localhost:3030',
  'http://localhost:8080',
];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : defaultOrigins;

module.exports = {
  port:          Number(process.env.PORT || process.env.REALTIME_PORT || 3040),
  env:           process.env.NODE_ENV || 'development',
  serviceName:   'realtime-service',
  allowedOrigins,

  redis: {
    host:     process.env.REDIS_HOST     || 'localhost',
    port:     Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || '',
    url:      process.env.REDIS_URL      || null,
  },

  jwt: {
    // Canonical Batch C: RS256-only (issued by auth-service). HS256 fallback removed.
    publicKey:    process.env.JWT_PUBLIC_KEY      || '',
    publicKeyB64: process.env.JWT_PUBLIC_KEY_B64  || '',
    issuer:       process.env.JWT_ISSUER          || 'baalvion-auth',
    audience:     process.env.JWT_AUDIENCE        || 'baalvion-platform',
    jwksUri:      process.env.JWKS_URI            || 'http://localhost:3001/.well-known/jwks.json',
    jwksTtlMs:    Number(process.env.JWKS_TTL_MS  || 300_000),
    // Hardened: auth bypass is impossible in production regardless of env (default-secure).
    // Only honored outside production for local dev.
    bypassAuth:   process.env.NODE_ENV !== 'production' && process.env.JWT_BYPASS_AUTH === 'true',
  },

  rateLimit: {
    maxPerMinute: Number(process.env.WS_RATE_LIMIT_PER_MINUTE || 60),
    // Legacy per-second config still supported
    maxPerSecond: Number(process.env.WS_RATE_LIMIT_PER_SECOND || 30),
  },

  // Namespace-to-required-role mapping
  namespaceRoles: {
    '/dashboard': ['member', 'admin', 'super_admin', 'org_admin'],
    '/ir':        ['member', 'admin', 'super_admin', 'org_admin', 'investor'],
    '/jobs':      ['member', 'admin', 'super_admin', 'org_admin', 'recruiter'],
    '/admin':     ['admin', 'super_admin'],
    '/ctm':       ['member', 'admin', 'super_admin', 'org_admin', 'trader'],
  },

  // Reconnect replay buffer
  replay: {
    windowMs:    5 * 60 * 1000,   // 5 minutes
    maxEvents:   100,
    ttlSeconds:  5 * 60,          // Redis key TTL
  },

  // Heartbeat
  heartbeat: {
    intervalMs: 30_000,
  },

  // Downstream services to poll for health
  services: [
    { name: 'auth-service',         url: process.env.AUTH_SERVICE_URL    || 'http://localhost:3001', metricsPort: 9461 },
    { name: 'admin-service',        url: process.env.ADMIN_SERVICE_URL   || 'http://localhost:3021', metricsPort: 9462 },
    { name: 'session-service',      url: process.env.SESSION_SERVICE_URL || 'http://localhost:3022', metricsPort: 9463 },
    { name: 'oauth-service',        url: process.env.OAUTH_SERVICE_URL   || 'http://localhost:3023', metricsPort: 9464 },
    { name: 'notification-service', url: process.env.NOTIF_SERVICE_URL   || 'http://localhost:3031', metricsPort: 9467 },
  ],

  // Push intervals (ms)
  intervals: {
    metrics:     Number(process.env.METRICS_INTERVAL   || 5000),
    health:      Number(process.env.HEALTH_INTERVAL    || 10000),
    events:      Number(process.env.EVENTS_INTERVAL    || 2000),
  },

  eventBus: {
    stream:      process.env.EVENT_BUS_STREAM || 'baalvion:events',
    adminStats:  process.env.ADMIN_SERVICE_STATS_URL || 'http://localhost:3021/v1/admin/stats',
  },
};
