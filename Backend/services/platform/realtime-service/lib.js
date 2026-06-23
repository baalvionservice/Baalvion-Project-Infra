'use strict';
/**
 * Pure, side-effect-free helpers for the realtime-service.
 *
 * Extracted into their own module so they can be unit-tested without booting the
 * HTTP/WebSocket server, opening a Postgres pool, or connecting to Redis (all of
 * which `index.js` does on import). Nothing here performs I/O.
 */

// Secret fallbacks that are acceptable in dev/test but MUST NOT silently apply in
// production. Mirrors the hardcoded dev default used by the Postgres pool.
const DEV_DB_PASSWORD_FALLBACK = 'baalvion_dev_pass';

/**
 * Production secret guard. Returns the configured value when present; otherwise
 * returns the supplied dev fallback outside production. In production a missing
 * value throws — fail fast rather than booting with a known dev credential.
 *
 * @param {string} name       env var name (for the error message)
 * @param {string|undefined} value   the env var's current value
 * @param {string} devFallback the dev default to use when not in production
 * @param {string} [nodeEnv]   defaults to process.env.NODE_ENV
 * @returns {string}
 */
function requireSecret(name, value, devFallback, nodeEnv = process.env.NODE_ENV) {
    if (value != null && value !== '') return value;
    if (nodeEnv === 'production') {
        throw new Error(`[realtime-service] ${name} is required in production (refusing to fall back to the dev default)`);
    }
    return devFallback;
}

/**
 * Build the set of allowed CORS origins from a comma-separated env string.
 * Falls back to localhost for local dev; never falls back to "*".
 *
 * @param {string|undefined} raw
 * @returns {Set<string>}
 */
function resolveAllowedOrigins(raw) {
    const value = raw || 'http://localhost:3030';
    return new Set(value.split(',').map((s) => s.trim()).filter(Boolean));
}

/**
 * Echo-back CORS helper: returns the request origin only when it is allow-listed,
 * otherwise null (so no Access-Control-Allow-Origin header is emitted).
 *
 * @param {string|undefined} reqOrigin
 * @param {Set<string>} allowedOrigins
 * @returns {string|null}
 */
function getAllowOriginHeader(reqOrigin, allowedOrigins) {
    if (!reqOrigin) return null;
    if (allowedOrigins.has(reqOrigin)) return reqOrigin;
    return null;
}

/**
 * Role gate: true when the caller holds at least one infra-telemetry role.
 *
 * @param {string[]|undefined} roles
 * @param {Set<string>} infraRoles
 * @returns {boolean}
 */
function hasInfraRole(roles, infraRoles) {
    if (!Array.isArray(roles)) return false;
    return roles.some((r) => infraRoles.has(r));
}

module.exports = {
    DEV_DB_PASSWORD_FALLBACK,
    requireSecret,
    resolveAllowedOrigins,
    getAllowOriginHeader,
    hasInfraRole,
};
