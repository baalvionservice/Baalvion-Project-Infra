'use strict';

/**
 * @baalvion/auth-node/dbSsl — canonical Postgres TLS (in-transit) configuration.
 *
 * RDS enforces `rds.force_ssl=1` in production, so every service MUST present an
 * SSL config or the connection is refused. Historically the SSL block was copied
 * verbatim into a handful of services (order/inventory/fulfillment `config/database.js`,
 * proxy `timeseriesDb.js` / `models/index.js`). This consolidates that one proven
 * pattern into a single shared helper so it can be adopted everywhere without
 * duplication. It lives in auth-node — the one package already depended on by every
 * backend service — so adoption needs NO new dependency and NO lockfile change.
 *
 * SECURE BY DEFAULT, BACKWARD COMPATIBLE:
 *   - DB_SSL unset  → TLS engages in production only (NODE_ENV==='production'),
 *                     and is OFF in development/test. This preserves the existing
 *                     localhost-without-TLS dev behaviour byte-for-byte.
 *   - DB_SSL=true|require|1|on   → force TLS on (any environment)
 *   - DB_SSL=false|0|disable|off → force TLS off (trusted private networks only)
 *   - certificate verification is ON unless DB_SSL_REJECT_UNAUTHORIZED=false
 *     (last-resort escape hatch for a managed PG whose CA is not in the trust store)
 *   - pin the CA via DB_SSL_CA (inline PEM) or DB_SSL_CA_PATH (file, preferred)
 *
 * Env var names match the already-shipped order/inventory/fulfillment/proxy hardening.
 */

const fs = require('fs');

/** Resolve a CA certificate from env (inline PEM or a file path), or undefined. */
function caFromEnv(env) {
  if (env.DB_SSL_CA) return env.DB_SSL_CA.includes('-----BEGIN')
    ? env.DB_SSL_CA.replace(/\\n/g, '\n')
    : env.DB_SSL_CA;
  if (env.DB_SSL_CA_PATH) {
    try { return fs.readFileSync(env.DB_SSL_CA_PATH, 'utf8'); }
    catch (_) { return undefined; }
  }
  return undefined;
}

/**
 * Whether DB TLS should be engaged for the current environment.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {boolean}
 */
function isDbTlsEnabled(env = process.env) {
  const flag = String(env.DB_SSL == null ? '' : env.DB_SSL).trim().toLowerCase();
  if (flag === 'false' || flag === '0' || flag === 'disable' || flag === 'off' || flag === 'no') return false;
  if (flag === 'true' || flag === '1' || flag === 'require' || flag === 'on' || flag === 'yes') return true;
  // Unset / unrecognised → on in production, off everywhere else.
  return env.NODE_ENV === 'production';
}

/** Shared verify settings used by both the Sequelize and raw-pg shapes. */
function verifySettings(env) {
  const ca = caFromEnv(env);
  return {
    rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(ca ? { ca } : {}),
  };
}

/**
 * Sequelize `dialectOptions.ssl` value.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {false | { require: true, rejectUnauthorized: boolean, ca?: string }}
 */
function buildPgSsl(env = process.env) {
  if (!isDbTlsEnabled(env)) return false;
  return { require: true, ...verifySettings(env) };
}

/**
 * node-postgres `Pool`/`Client` `ssl` value. (pg has no `require` key — presence of
 * the ssl object is what enables TLS; `false` disables it.)
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {false | { rejectUnauthorized: boolean, ca?: string }}
 */
function buildPgPoolSsl(env = process.env) {
  if (!isDbTlsEnabled(env)) return false;
  return verifySettings(env);
}

/**
 * Convenience: a full Sequelize `dialectOptions` object ready to spread/assign.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 * @returns {{ ssl: ReturnType<typeof buildPgSsl> }}
 */
function buildPgDialectOptions(env = process.env) {
  return { ssl: buildPgSsl(env) };
}

module.exports = {
  isDbTlsEnabled,
  buildPgSsl,
  buildPgPoolSsl,
  buildPgDialectOptions,
};
