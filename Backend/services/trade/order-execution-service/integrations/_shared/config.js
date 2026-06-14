'use strict';
/**
 * Tiny config/env helpers for real vendor adapters. Secrets come ONLY from the
 * environment (or a secret manager that populates it) — never hardcoded, never
 * logged. Adapters call `isConfigured(...)` to decide whether they can operate;
 * when not configured, adapter methods throw IntegrationRequiredError rather than
 * silently no-op, so an unconfigured real adapter can never be mistaken for a
 * working (or worse, a passing-but-fake) one.
 */

/** Read an env var, trimmed; returns undefined when absent/blank. */
function env(name, source = process.env) {
    const v = source[name];
    if (v == null) return undefined;
    const t = String(v).trim();
    return t === '' ? undefined : t;
}

/** True iff every named env var is present and non-blank. */
function isConfigured(names, source = process.env) {
    return names.every((n) => env(n, source) !== undefined);
}

/**
 * Validate an operator-set URL string. Returns a parsed URL or throws.
 *
 * Guards against SSRF from a mis-set base-url env: an adapter that sends a
 * secret/key to `BASE_URL` must never send it to an attacker-controlled or
 * non-http(s) host. Pass `allowHosts` to host-lock (e.g. a known vendor host);
 * omit it for legitimately operator-chosen internal hosts (self-hosted yente).
 *
 * @param {string} value                          the URL string to validate
 * @param {{ allowHosts?: string[] }} [opts]
 *   allowHosts — when present, the URL host must be one of these (case-insensitive)
 * @returns {URL}
 * @throws {Error} code 'INVALID_URL' (unparseable / non-http(s)) or
 *                 'HOST_NOT_ALLOWED' (host not in allowHosts)
 */
function parseHttpUrl(value, opts = {}) {
    let url;
    try {
        url = new URL(String(value == null ? '' : value));
    } catch {
        const err = new Error(`invalid URL: ${value}`);
        err.code = 'INVALID_URL';
        throw err;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        const err = new Error(`URL protocol must be http/https, got ${url.protocol}`);
        err.code = 'INVALID_URL';
        throw err;
    }
    if (Array.isArray(opts.allowHosts) && opts.allowHosts.length) {
        const allowed = opts.allowHosts.map((h) => String(h).toLowerCase());
        if (!allowed.includes(url.hostname.toLowerCase())) {
            const err = new Error(`URL host '${url.hostname}' not in allowed set [${allowed.join(', ')}]`);
            err.code = 'HOST_NOT_ALLOWED';
            throw err;
        }
    }
    return url;
}

/** Collect the named vars into an object; throws listing any that are missing. */
function requireEnv(names, source = process.env) {
    const out = {};
    const missing = [];
    for (const n of names) {
        const v = env(n, source);
        if (v === undefined) missing.push(n);
        else out[n] = v;
    }
    if (missing.length) {
        const err = new Error(`missing required config: ${missing.join(', ')}`);
        err.code = 'CONFIG_MISSING';
        err.missing = missing;
        throw err;
    }
    return out;
}

module.exports = { env, isConfigured, requireEnv, parseHttpUrl };
