'use strict';
/**
 * SSRF guard — validates a user-supplied URL before making an outbound HTTP
 * request to it.  Blocks:
 *   - Non-HTTP/HTTPS schemes
 *   - Hostnames that resolve to loopback, private, link-local, or ULA ranges
 *   - The cloud metadata endpoint (169.254.169.254)
 *
 * Defense-in-depth against DNS rebinding: ALL resolved addresses are checked,
 * not just the first one.
 */
const dns = require('dns');
const net = require('net');

// ---------------------------------------------------------------------------
// Private-range CIDR matchers
// ---------------------------------------------------------------------------

function ipToLong(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

const IPV4_PRIVATE_RANGES = [
    // loopback
    { start: ipToLong('127.0.0.0'),   end: ipToLong('127.255.255.255') },
    // RFC-1918
    { start: ipToLong('10.0.0.0'),    end: ipToLong('10.255.255.255') },
    { start: ipToLong('172.16.0.0'),  end: ipToLong('172.31.255.255') },
    { start: ipToLong('192.168.0.0'), end: ipToLong('192.168.255.255') },
    // link-local (incl. cloud metadata at 169.254.169.254)
    { start: ipToLong('169.254.0.0'), end: ipToLong('169.254.255.255') },
    // unspecified
    { start: ipToLong('0.0.0.0'),     end: ipToLong('0.0.0.255') },
];

function isPrivateIPv4(ip) {
    const val = ipToLong(ip);
    return IPV4_PRIVATE_RANGES.some(r => val >= r.start && val <= r.end);
}

function isPrivateIPv6(ip) {
    const lower = ip.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
    // ::1 loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // :: unspecified
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
    // fc00::/7 — ULA (covers fc00:: through fdff::)
    if (/^f[cd]/i.test(lower)) return true;
    // fe80::/10 — link-local
    if (/^fe[89ab]/i.test(lower)) return true;
    return false;
}

function isPrivateAddress(addr) {
    if (net.isIPv4(addr)) return isPrivateIPv4(addr);
    if (net.isIPv6(addr)) return isPrivateIPv6(addr);
    return true; // unknown — block by default
}

// ---------------------------------------------------------------------------
// Blocked hostnames (literal)
// ---------------------------------------------------------------------------

const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'ip6-localhost',
    'ip6-loopback',
]);

function isBlockedHostname(hostname) {
    const h = hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(h)) return true;
    // *.localhost TLD
    if (h.endsWith('.localhost')) return true;
    return false;
}

// ---------------------------------------------------------------------------
// Main guard
// ---------------------------------------------------------------------------

/**
 * Validates that `rawUrl` is safe to fetch.
 * Throws an Error with message starting with "SSRF_BLOCKED:" if unsafe.
 *
 * @param {string} rawUrl
 * @returns {Promise<URL>}  The parsed URL object (ready to use).
 */
async function assertSafeUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('SSRF_BLOCKED: Invalid URL');
    }

    // 1. Protocol must be http or https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`SSRF_BLOCKED: Disallowed protocol "${parsed.protocol}"`);
    }

    const hostname = parsed.hostname;

    // 2. Reject known-bad literal hostnames
    if (isBlockedHostname(hostname)) {
        throw new Error(`SSRF_BLOCKED: Hostname "${hostname}" is not allowed`);
    }

    // 3. If the hostname is already an IP literal, check it directly
    if (net.isIP(hostname)) {
        if (isPrivateAddress(hostname)) {
            throw new Error(`SSRF_BLOCKED: IP address "${hostname}" is in a blocked range`);
        }
        return parsed;
    }

    // 4. DNS resolve ALL addresses and check each one (anti-rebinding)
    let addresses;
    try {
        addresses = await new Promise((resolve, reject) => {
            dns.lookup(hostname, { all: true }, (err, addrs) => {
                if (err) return reject(err);
                resolve(addrs);
            });
        });
    } catch (err) {
        throw new Error(`SSRF_BLOCKED: DNS resolution failed for "${hostname}": ${err.message}`);
    }

    if (!addresses || addresses.length === 0) {
        throw new Error(`SSRF_BLOCKED: No DNS records found for "${hostname}"`);
    }

    for (const { address } of addresses) {
        if (isPrivateAddress(address)) {
            throw new Error(
                `SSRF_BLOCKED: "${hostname}" resolves to private address "${address}"`
            );
        }
    }

    return parsed;
}

module.exports = { assertSafeUrl };
