'use strict';

/**
 * Connection pool to the usage time-series store (TimescaleDB).
 *
 * Uses TIMESERIES_DATABASE_URL if set, else falls back to the primary DB_*
 * connection (TimescaleDB can be an extension on the same Postgres instance).
 * All metering/analytics reads & writes go through here — never the OLTP models.
 */

const { Pool } = require('pg');
const logger = require('./logger');

function buildConfig() {
  if (process.env.TIMESERIES_DATABASE_URL) {
    return { connectionString: process.env.TIMESERIES_DATABASE_URL, ssl: sslOpt() };
  }
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: sslOpt() };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.TIMESERIES_DB_NAME || process.env.DB_NAME || 'baalvion_db',
    user: process.env.DB_USER || 'baalvion',
    password: process.env.DB_PASSWORD || '',
    ssl: sslOpt(),
  };
}

function sslOpt() {
  // SECURE BY DEFAULT: TLS on and the server cert verified. The old default
  // ({ rejectUnauthorized: false }) accepted ANY cert (MITM) and was only
  // "secure" by turning TLS OFF (DB_SSL=false) — backwards. Now:
  //   - DB_SSL=false               → no TLS (trusted private networks only)
  //   - DB_SSL_REJECT_UNAUTHORIZED=false → TLS on, cert NOT verified (last resort)
  //   - DB_SSL_CA                  → pin the CA PEM for a private/self-signed CA
  //   - otherwise                  → TLS on, cert verified
  if (process.env.DB_SSL === 'false') return false;
  const ca = process.env.DB_SSL_CA || undefined;
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(ca ? { ca } : {}),
  };
}

const pool = new Pool({ ...buildConfig(), max: Number(process.env.TIMESERIES_POOL_MAX || 10) });
pool.on('error', (err) => logger.error('[timeseries] pool error:', err.message));

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
