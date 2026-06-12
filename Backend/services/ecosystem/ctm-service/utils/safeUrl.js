'use strict';
// SSRF guard: validate a user-supplied URL before making an outbound fetch.
// Call assertSafeUrl(url) — throws AppError(403) if the URL targets a private
// or loopback address so the caller can never pivot to internal infrastructure.
const dns = require('dns').promises;
const { AppError } = require('./errors');

// IPv4 CIDR blocks that must never be reachable.
const BLOCKED_V4 = [
    [0x7f000000, 0xff000000],   // 127.0.0.0/8   loopback
    [0x0a000000, 0xff000000],   // 10.0.0.0/8    private
    [0xac100000, 0xfff00000],   // 172.16.0.0/12 private
    [0xc0a80000, 0xffff0000],   // 192.168.0.0/16 private
    [0xa9fe0000, 0xffff0000],   // 169.254.0.0/16 link-local (incl. 169.254.169.254 AWS metadata)
    [0x00000000, 0xffffffff],   // 0.0.0.0/32
];

// Blocked literal hostnames (case-insensitive prefix/exact match).
const BLOCKED_HOSTNAMES = ['localhost'];

function ipv4ToInt(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
        const v = parseInt(p, 10);
        if (isNaN(v) || v < 0 || v > 255) return null;
        n = (n << 8) | v;
    }
    // Use unsigned 32-bit arithmetic.
    return n >>> 0;
}

function isBlockedIPv4(ip) {
    const n = ipv4ToInt(ip);
    if (n === null) return false;
    return BLOCKED_V4.some(([net, mask]) => (n & mask) === (net & mask));
}

function isBlockedIPv6(ip) {
    const lower = ip.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
    // Loopback ::1
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // Unspecified ::
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
    // ULA fc00::/7  (starts with fc or fd)
    if (/^f[cd]/i.test(lower)) return true;
    // Link-local fe80::/10
    if (/^fe[89ab]/i.test(lower)) return true;
    // IPv4-mapped ::ffff:x.x.x.x
    const v4mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4mapped) return isBlockedIPv4(v4mapped[1]);
    return false;
}

/**
 * Validate that `rawUrl` is a safe, routable HTTP/HTTPS URL.
 * Resolves DNS and rejects every address that falls into a private/loopback range
 * (defense against DNS rebinding: ALL resolved addresses must pass).
 *
 * @param {string} rawUrl
 * @returns {Promise<void>}
 * @throws {AppError} 403 if the URL is not safe.
 */
async function assertSafeUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new AppError('SSRF_BLOCKED', 'Invalid URL', 403);
    }

    const proto = parsed.protocol;
    if (proto !== 'http:' && proto !== 'https:') {
        throw new AppError('SSRF_BLOCKED', 'Only http and https URLs are permitted', 403);
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');

    // Block by hostname literal.
    if (BLOCKED_HOSTNAMES.includes(hostname) || hostname.endsWith('.localhost')) {
        throw new AppError('SSRF_BLOCKED', 'URL hostname is not permitted', 403);
    }

    // Resolve all addresses and reject if any is private.
    let addresses;
    try {
        const results = await dns.lookup(hostname, { all: true });
        addresses = results.map((r) => r.address);
    } catch {
        // DNS resolution failure → treat as unsafe (fail closed).
        throw new AppError('SSRF_BLOCKED', 'Could not resolve URL hostname', 403);
    }

    if (!addresses || addresses.length === 0) {
        throw new AppError('SSRF_BLOCKED', 'Could not resolve URL hostname', 403);
    }

    for (const addr of addresses) {
        if (isBlockedIPv4(addr) || isBlockedIPv6(addr)) {
            throw new AppError('SSRF_BLOCKED', 'URL resolves to a private or reserved address', 403);
        }
    }
}

module.exports = { assertSafeUrl };
