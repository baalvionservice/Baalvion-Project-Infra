'use strict';

/**
 * requireEnv — boot-time required environment variable loader.
 *
 * Replaces the insecure `process.env.X || 'placeholder'` fallback pattern that
 * let services silently boot on a publicly-known secret (e.g. the shared
 * 'replace-with-strong-secret' default that made HS256 token forgery trivial).
 *
 * A missing / empty required secret MUST crash the service at startup with a
 * clear message — it must NEVER degrade to a guessable default.
 *
 * @param {string}  name                 env var name, e.g. 'JWT_ACCESS_SECRET'
 * @param {object}  [opts]
 * @param {boolean} [opts.allowEmpty=false]  treat '' as a valid (set) value
 * @returns {string} the resolved, non-empty environment value
 * @throws {Error} when the variable is unset (or empty unless allowEmpty)
 */
function requireEnv(name, opts = {}) {
  const value = process.env[name];
  if (value === undefined || (!opts.allowEmpty && value === '')) {
    throw new Error(
      `[config] Required environment variable ${name} is not set. ` +
      `Refusing to boot on an insecure default — set ${name} (see .env.example) ` +
      `before starting this service.`,
    );
  }
  return value;
}

module.exports = { requireEnv };
