'use strict';
/**
 * @file utils/captcha.js
 * @description Server-side Cloudflare Turnstile verification for the public email-OTP request
 * endpoint. Bot/spam defence: the browser solves the Turnstile challenge and posts the token; we
 * confirm it with Cloudflare's siteverify before a code is ever sent.
 *
 * Posture: ENFORCED whenever TURNSTILE_SECRET_KEY is set (always in production). When unset
 * (local dev) verification is skipped so the flow stays runnable without a captcha — the same
 * fail-by-config pattern as the SMTP/mailer gate. Network/parse failures fail CLOSED so a flaky
 * verifier can never wave a bot through.
 */
const config = require('../config/appConfig');

const TURNSTILE = config.security.turnstile;

/** Whether Turnstile verification is active (a secret is configured). */
function isCaptchaConfigured() {
    return !!TURNSTILE.secretKey;
}

/**
 * Verify a Turnstile token with Cloudflare. Returns true when the challenge passed (or when no
 * secret is configured, i.e. local dev). Network/parse failures resolve to false (fail-closed).
 * @param {string} token      The cf-turnstile-response token from the browser widget.
 * @param {string} [remoteIp] The client IP (optional, improves Cloudflare's scoring).
 * @returns {Promise<boolean>}
 */
async function verifyTurnstile(token, remoteIp) {
    if (!isCaptchaConfigured()) return true; // dev: no secret → skip
    if (!token || typeof token !== 'string') return false;

    const body = new URLSearchParams();
    body.set('secret', TURNSTILE.secretKey);
    body.set('response', token);
    if (remoteIp) body.set('remoteip', remoteIp);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(TURNSTILE.verifyUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body,
            signal: controller.signal,
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data && data.success === true;
    } catch {
        return false; // fail-closed on timeout / network / parse error
    } finally {
        clearTimeout(timer);
    }
}

module.exports = { verifyTurnstile, isCaptchaConfigured };
