'use strict';
// Runs before each test file's modules load. Configure a test-safe env so the
// imported app doesn't rate-limit the suite or start background services.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.RATE_LIMIT_IP_MAX = '1000000';
process.env.DB_SYNC = 'false';
process.env.QUEUE_WORKERS = 'false';
