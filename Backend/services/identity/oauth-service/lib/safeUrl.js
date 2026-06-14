'use strict';

/**
 * SSRF guard for admin-configured OUTBOUND URLs (OIDC back-channel logout endpoints).
 *
 * Without this, an admin (or anyone able to write a client's logout config) could point
 * `backchannel_logout_uri` at an internal service or the cloud metadata endpoint
 * (http://169.254.169.254/…); the OP then fetches it on every user logout with a signed
 * token attached. We block loopback/private/link-local/metadata hosts and require https.
 */

function isBlockedHost(rawHost) {
    const host = String(rawHost).toLowerCase().replace(/^\[/, '').replace(/\]$/, ''); // strip IPv6 brackets
    if (!host) return true;
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1') return true;
    if (host === 'metadata.google.internal' || host === '169.254.169.254') return true;
    if (host.endsWith('.local') || host.endsWith('.internal')) return true;
    // IPv4 loopback / private / link-local
    if (/^127\./.test(host)) return true;
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^169\.254\./.test(host)) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return true;
    // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
    if (/^f[cd][0-9a-f]{2}:/i.test(host) || /^fe80:/i.test(host)) return true;
    return false;
}

/**
 * Validate an outbound URL. Throws on an unsafe/invalid URL; returns the normalized href.
 * @param {string} raw
 * @param {{ requireHttps?: boolean }} [opts]
 */
function assertSafeHttpUrl(raw, opts = {}) {
    const requireHttps = opts.requireHttps !== false;
    let url;
    try {
        url = new URL(String(raw));
    } catch {
        throw new Error('Invalid URL');
    }
    if (requireHttps) {
        if (url.protocol !== 'https:') throw new Error('URL must use https');
    } else if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('URL must use http(s)');
    }
    if (isBlockedHost(url.hostname)) {
        throw new Error('URL host is not allowed (private, loopback, link-local or metadata address)');
    }
    return url.href;
}

/** Non-throwing variant for defensive filtering on the send path. */
function isSafeHttpUrl(raw, opts) {
    try {
        assertSafeHttpUrl(raw, opts);
        return true;
    } catch {
        return false;
    }
}

module.exports = { assertSafeHttpUrl, isSafeHttpUrl, isBlockedHost };
