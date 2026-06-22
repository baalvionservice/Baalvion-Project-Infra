'use strict';
/**
 * @file utils/emailValidation.js
 * @description Genuine-email gate for the public sign-in/sign-up (email-OTP) flow.
 *
 *   • Rejects disposable / temporary / one-time inboxes (10MinuteMail, Mailinator, …) so the
 *     account base stays real and abuse-resistant.
 *   • Confirms the domain can actually receive mail — an MX record, or (RFC 5321 §5 implicit MX)
 *     an A/AAAA record — BEFORE a code is ever sent, so we never email a black hole.
 *
 * Genuine providers (Gmail, Yahoo, Outlook/Hotmail, ProtonMail, Zoho, iCloud, …) and any
 * legitimate custom business domain with valid DNS are allowed; everything disposable is not.
 */
const dns = require('node:dns').promises;
const config = require('../config/appConfig');
const { AppError } = require('./errors');

// Curated baseline of the most common disposable providers. ALWAYS-present fallback so the gate
// works even before `disposable-email-domains` is installed and stays offline-safe in tests.
const CURATED_DISPOSABLE = new Set([
    'mailinator.com', '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net',
    'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'temp-mail.org', 'tempmail.com', 'tempmail.dev',
    'tempmailo.com', 'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.de', 'yopmail.com', 'yopmail.fr',
    'dispostable.com', 'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'throwawaymail.com', 'fakeinbox.com',
    'mailcatch.com', 'mohmal.com', 'emailondeck.com', 'spamgourmet.com', 'mytemp.email', 'tempr.email',
    'discard.email', 'mailsac.com', 'inboxkitten.com', 'tempinbox.com', 'temp-mail.io', 'moakt.com',
    'burnermail.io', 'tempmail.plus', 'minuteinbox.com', 'fakemail.net', 'wegwerfmail.de', 'einrot.com',
    'cock.li', 'instaddr.win', 'vomoto.com', 'gettempmail.com', 'tmail.ws', '33mail.com', 'mailtemp.net',
    'spam4.me', 'tempail.com', 'tempemail.co', 'luxusmail.org', 'emailfake.com', 'fakemailgenerator.com',
]);

// Known-good consumer providers — short-circuit MX lookups (always deliverable; avoids penalising
// users when our resolver is briefly flaky). NOT an allowlist-only gate; unknown business domains
// are still allowed when their DNS checks out.
const KNOWN_GOOD = new Set([
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in', 'ymail.com', 'rocketmail.com',
    'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com', 'protonmail.com', 'proton.me', 'pm.me',
    'zoho.com', 'zohomail.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'gmx.com', 'gmx.net', 'mail.com',
    'fastmail.com', 'hey.com', 'yandex.com', 'tutanota.com', 'tuta.io',
]);

// Best-effort augmentation from the maintained package (≈3.5k domains). Loaded DEFENSIVELY so a
// missing/incompatible install never breaks the gate — we just fall back to CURATED_DISPOSABLE.
let packageDisposable = null;
try {
    // eslint-disable-next-line global-require
    const list = require('disposable-email-domains');
    if (Array.isArray(list)) packageDisposable = new Set(list);
} catch { /* not installed — curated set is enough */ }

/** Lower-cased domain part of an email, or '' when malformed. */
function domainOf(email) {
    return String(email || '').toLowerCase().trim().split('@')[1] || '';
}

/** True when the address belongs to a known disposable/temporary provider. */
function isDisposableEmail(email) {
    const domain = domainOf(email);
    if (!domain) return false;
    if (CURATED_DISPOSABLE.has(domain)) return true;
    if (packageDisposable && packageDisposable.has(domain)) return true;
    return false;
}

/** Race a DNS lookup against a timeout so a slow resolver can't stall the request. */
async function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('DNS_TIMEOUT')), ms); });
    try { return await Promise.race([promise, timeout]); }
    finally { clearTimeout(timer); }
}

/**
 * Whether a domain can receive mail: an MX record, or (RFC 5321 implicit MX) an A/AAAA record.
 * Returns true for KNOWN_GOOD providers without a lookup. A total resolver failure → false
 * (treated as undeliverable so we never email into the void).
 * @param {string} domain
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>}
 */
async function hasDeliverableDomain(domain, timeoutMs = 4000) {
    if (!domain) return false;
    if (KNOWN_GOOD.has(domain)) return true;
    try {
        const mx = await withTimeout(dns.resolveMx(domain), timeoutMs);
        if (Array.isArray(mx) && mx.some((r) => r && r.exchange)) return true;
    } catch { /* fall through to A/AAAA (implicit MX) */ }
    const a = await withTimeout(dns.resolve(domain), timeoutMs).catch(() => null);
    if (Array.isArray(a) && a.length) return true;
    const aaaa = await withTimeout(dns.resolve6(domain), timeoutMs).catch(() => null);
    return Array.isArray(aaaa) && aaaa.length > 0;
}

/**
 * Throw a clear AppError when the email is disposable or its domain is undeliverable; resolves
 * (no-op) when the address passes. Honours the security.emailValidation toggles.
 * @param {string} email
 */
async function assertGenuineEmail(email) {
    const cfg = config.security.emailValidation;
    if (cfg.rejectDisposable && isDisposableEmail(email)) {
        throw new AppError(
            'DISPOSABLE_EMAIL',
            'Temporary or disposable email addresses aren’t allowed. Please use a permanent email (Gmail, Outlook, your work address, etc.).',
            400,
        );
    }
    if (cfg.requireMx) {
        const ok = await hasDeliverableDomain(domainOf(email), cfg.dnsTimeoutMs);
        if (!ok) {
            throw new AppError(
                'EMAIL_DOMAIN_INVALID',
                'We couldn’t verify that email domain. Please double-check the address and try again.',
                400,
            );
        }
    }
}

module.exports = { isDisposableEmail, hasDeliverableDomain, assertGenuineEmail, domainOf };
