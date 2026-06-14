'use strict';

/**
 * SSRF guard for outbound webhook URLs.
 *
 * Rules enforced:
 *  - Protocol must be http: or https: (rejects file:, ftp:, data:, etc.)
 *  - In production (NODE_ENV === 'production'), protocol MUST be https:
 *  - Hostname must not be localhost, *.localhost, or resolve to any private /
 *    loopback / link-local / ULA IPv4/IPv6 range
 *  - Every resolved address is checked (defends against DNS rebinding)
 *
 * Blocked CIDR ranges:
 *   IPv4: 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16,
 *         169.254.0.0/16 (includes cloud-metadata 169.254.169.254), 0.0.0.0/8
 *   IPv6: ::1, ::, fc00::/7, fe80::/10
 */

const dns = require('dns');
const { Errors } = require('./errors');

// ── private-range helpers ─────────────────────────────────────────────────────

/** Parse a dotted-decimal IPv4 string to a 32-bit unsigned integer. */
function ipv4ToInt(addr) {
    return addr.split('.').reduce((acc, octet) => (acc * 256 + Number(octet)) >>> 0, 0);
}

/** Return true when the IPv4 address falls in a blocked range. */
function isPrivateIPv4(addr) {
    const n = ipv4ToInt(addr);
    const RANGES = [
        [ipv4ToInt('0.0.0.0'),   0xff000000],   // 0.0.0.0/8
        [ipv4ToInt('10.0.0.0'),  0xff000000],   // 10.0.0.0/8
        [ipv4ToInt('127.0.0.0'), 0xff000000],   // 127.0.0.0/8  (loopback)
        [ipv4ToInt('169.254.0.0'), 0xffff0000], // 169.254.0.0/16 (link-local, cloud metadata)
        [ipv4ToInt('172.16.0.0'), 0xfff00000],  // 172.16.0.0/12
        [ipv4ToInt('192.168.0.0'), 0xffff0000], // 192.168.0.0/16
    ];
    return RANGES.some(([base, mask]) => (n & mask) === (base & mask));
}

/** Return true when the IPv6 address falls in a blocked range. */
function isPrivateIPv6(addr) {
    // Normalise: strip zone ID, lowercase
    const normalised = addr.replace(/%.*$/, '').toLowerCase();

    // Loopback
    if (normalised === '::1' || normalised === '::') return true;

    // Expand the first 2 bytes for prefix checks
    try {
        // Expand full address to 8 groups of 4 hex digits
        let full = normalised;
        if (full.includes('::')) {
            const sides = full.split('::');
            const left = sides[0] ? sides[0].split(':') : [];
            const right = sides[1] ? sides[1].split(':') : [];
            const missing = 8 - left.length - right.length;
            full = [...left, ...Array(missing).fill('0'), ...right].join(':');
        }
        const groups = full.split(':').map((g) => parseInt(g || '0', 16));
        const first = groups[0];

        // fc00::/7  — Unique Local Addresses (fc00 – fdff)
        if ((first & 0xfe00) === 0xfc00) return true;
        // fe80::/10 — Link-Local
        if ((first & 0xffc0) === 0xfe80) return true;
    } catch {
        // If we cannot parse the address, block it (fail-closed)
        return true;
    }
    return false;
}

/** Return true when a resolved address is in any blocked range. */
function isBlockedAddress(addr, family) {
    if (family === 4) return isPrivateIPv4(addr);
    if (family === 6) return isPrivateIPv6(addr);
    return true; // unknown family → block
}

// ── localhost name check ──────────────────────────────────────────────────────

const LOCALHOST_RE = /^localhost$/i;

/** Return true when the hostname is localhost or *.localhost */
function isLocalhostName(hostname) {
    return LOCALHOST_RE.test(hostname) || hostname.toLowerCase().endsWith('.localhost');
}

// ── DNS resolution (all addresses) ───────────────────────────────────────────

/**
 * Resolve ALL addresses for a hostname using dns.lookup with {all:true}.
 * Returns an array of {address, family} objects.
 * Rejects on DNS error.
 */
function resolveAll(hostname) {
    return new Promise((resolve, reject) => {
        dns.lookup(hostname, { all: true }, (err, results) => {
            if (err) return reject(err);
            resolve(results || []);
        });
    });
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * validateWebhookUrl(rawUrl)
 *
 * Validates that rawUrl is safe to use as a webhook delivery target.
 * Throws Errors.badRequest() (HTTP 400) for any SSRF-unsafe or invalid URL.
 *
 * @param {string} rawUrl - The URL to validate (from user input)
 * @returns {Promise<string>} The original rawUrl string (unchanged, so callers
 *                            can still store/use the user-supplied value)
 */
async function validateWebhookUrl(rawUrl) {
    // ── 1. Parse ──────────────────────────────────────────────────────────────
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw Errors.badRequest('Invalid webhook URL');
    }

    const protocol = parsed.protocol; // includes trailing colon, e.g. "https:"

    // ── 2. Protocol allowlist ─────────────────────────────────────────────────
    if (protocol !== 'https:' && protocol !== 'http:') {
        throw Errors.badRequest('Webhook URL must use http or https');
    }

    // ── 3. HTTPS enforcement in production ────────────────────────────────────
    if (process.env.NODE_ENV === 'production' && protocol !== 'https:') {
        throw Errors.badRequest('Webhook URL must use https in production');
    }

    const hostname = parsed.hostname;

    // ── 4. Localhost name check ───────────────────────────────────────────────
    if (isLocalhostName(hostname)) {
        throw Errors.badRequest('Webhook URL must not target a local address');
    }

    // ── 5. DNS resolution + private-range check (defence vs DNS rebinding) ────
    let records;
    try {
        records = await resolveAll(hostname);
    } catch (dnsErr) {
        // Treat DNS errors as invalid / unresolvable — block to be safe
        throw Errors.badRequest(`Webhook URL hostname could not be resolved: ${dnsErr.message}`);
    }

    if (!records.length) {
        throw Errors.badRequest('Webhook URL hostname resolved to no addresses');
    }

    for (const { address, family } of records) {
        if (isBlockedAddress(address, family)) {
            throw Errors.badRequest('Webhook URL must not target a private or internal address');
        }
    }

    return rawUrl;
}

module.exports = { validateWebhookUrl };
