'use strict';
/**
 * Passwordless login via one-time email codes for proxy.baalvionstack.com customers.
 *
 * Flow:
 *   1. POST /v1/auth/email/otp/request { email } → a 6-digit code is emailed.
 *   2. POST /v1/auth/email/otp/verify  { email, code } → find-or-create the account (same
 *      provisioning as social login) and mint the SAME RS256 session as password login.
 *
 * Mirrors the central auth-service email-OTP design, adapted to proxy-service primitives:
 *   - raw parameterized SQL for the email_otps table (matches ssoService/oauthService style),
 *   - signupService.provisionOAuthAccount for new (passwordless) accounts,
 *   - ssoService.completeLogin for session minting — the SAME path OAuth/SAML/OIDC use.
 *
 * Security model:
 *   - Codes are random numeric strings; only sha256(code) is persisted.
 *   - Exactly one live code per email (each request burns the prior live codes).
 *   - Single-use (consumed_at), time-bound (expires_at), attempt-bound (attempts).
 *   - Per-email resend cooldown on top of the controller's per-IP limiter.
 *   - Keyed by EMAIL (pre-auth): the user is created on first successful verify.
 *   - MFA is NOT gated here — this matches proxy-service's existing social-login fast path.
 */
const crypto = require('node:crypto');

const db = require('../models');
const store = require('./platformStore');
const signupService = require('./signupService');
const sso = require('./ssoService');
const { sha256, timingSafeEqualHex } = require('../utils/crypto');
const { sendOtpEmail, isMailerConfigured } = require('../utils/emailService');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const Q = db.Sequelize.QueryTypes;

const OTP = {
    length:         Number(process.env.OTP_LENGTH           || 6),
    ttlSeconds:     Number(process.env.OTP_TTL_SECONDS       || 600),
    maxAttempts:    Number(process.env.OTP_MAX_ATTEMPTS      || 5),
    resendCooldown: Number(process.env.OTP_RESEND_COOLDOWN_S || 60),
};

/** Cryptographically-strong numeric code (rejection sampling → no modulo bias). */
function generateNumericCode(length) {
    let out = '';
    while (out.length < length) {
        for (const b of crypto.randomBytes(length)) {
            if (out.length >= length) break;
            if (b < 250) out += String(b % 10); // reject 250..255 to keep digits uniform
        }
    }
    return out;
}

/** "j***@example.com" — never echo the full local part back to the caller. */
function maskEmail(email) {
    const [local = '', domain = ''] = String(email).split('@');
    return `${local.slice(0, 1)}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
}

/**
 * Pure verify-attempt decision (no I/O) — exhaustively unit-testable. The caller applies the
 * side effects (consume / increment attempts) from the outcome.
 */
function classifyOtpAttempt(record, code, { nowMs = Date.now(), maxAttempts = OTP.maxAttempts } = {}) {
    if (!record) return { outcome: 'no_code', attempts: 0, exhausted: false };
    if (nowMs > new Date(record.expires_at).getTime()) return { outcome: 'expired', attempts: record.attempts, exhausted: false };
    if (record.attempts >= maxAttempts) return { outcome: 'locked', attempts: record.attempts, exhausted: true };

    const attempts = record.attempts + 1; // a wrong guess always burns a try
    const matches = timingSafeEqualHex(sha256(String(code)), record.code_hash);
    if (!matches) return { outcome: 'invalid', attempts, exhausted: attempts >= maxAttempts };
    return { outcome: 'ok', attempts, exhausted: false };
}

/**
 * Issue (or re-issue) a one-time login code for an email. Always succeeds for any valid email
 * (find-or-create happens on verify) → no account-enumeration signal.
 */
async function requestOtp({ email, ipAddress }) {
    const normEmail = String(email).toLowerCase().trim();

    if (!isMailerConfigured() && config.env === 'production') {
        throw new AppError('EMAIL_DELIVERY_UNAVAILABLE', 'Email login is temporarily unavailable. Please use another sign-in method.', 503);
    }

    // Per-email resend cooldown (defence-in-depth on top of the per-IP route limiter).
    const [latest] = await db.sequelize.query(
        'SELECT created_at, consumed_at FROM email_otps WHERE email = :e ORDER BY created_at DESC LIMIT 1',
        { replacements: { e: normEmail }, type: Q.SELECT },
    );
    if (latest && !latest.consumed_at) {
        const elapsedMs = Date.now() - new Date(latest.created_at).getTime();
        const cooldownMs = OTP.resendCooldown * 1000;
        if (elapsedMs < cooldownMs) {
            const wait = Math.ceil((cooldownMs - elapsedMs) / 1000);
            throw new AppError('OTP_COOLDOWN', `Please wait ${wait}s before requesting another code`, 429);
        }
    }

    // Exactly one live code per email.
    await db.sequelize.query(
        'UPDATE email_otps SET consumed_at = now(), updated_at = now() WHERE email = :e AND consumed_at IS NULL',
        { replacements: { e: normEmail }, type: Q.UPDATE },
    );

    const code = generateNumericCode(OTP.length);
    const expiresAt = new Date(Date.now() + OTP.ttlSeconds * 1000);
    const [rows] = await db.sequelize.query(
        'INSERT INTO email_otps (email, code_hash, purpose, expires_at) VALUES (:e, :h, :p, :exp) RETURNING id',
        { replacements: { e: normEmail, h: sha256(code), p: 'login', exp: expiresAt.toISOString() }, type: Q.INSERT },
    );
    const recordId = rows && rows[0] && rows[0].id;

    const minutes = Math.round(OTP.ttlSeconds / 60);
    try {
        // NOT fire-and-forget — surface delivery failures and release the burned code so the
        // cooldown doesn't block an immediate retry.
        await sendOtpEmail({ toEmail: normEmail, code, expiresInMinutes: minutes });
    } catch (err) {
        if (recordId) {
            await db.sequelize.query('UPDATE email_otps SET consumed_at = now() WHERE id = :id', { replacements: { id: recordId }, type: Q.UPDATE }).catch(() => {});
        }
        throw new AppError('EMAIL_SEND_FAILED', 'Could not send your login code. Please try again.', 502);
    }

    return {
        sentTo:                   maskEmail(normEmail),
        expiresAt:                expiresAt.toISOString(),
        resendAvailableInSeconds: OTP.resendCooldown,
    };
}

/** Find-or-create the account for a verified email, then mint a session via the shared SSO path. */
async function loginForEmail(normEmail, { ipAddress, userAgent }) {
    const existing = await store.findUserByEmail(normEmail);
    let sessionUser, role, isNewUser;

    if (existing) {
        if (existing.status && existing.status !== 'active') {
            throw new AppError('ACCOUNT_DISABLED', 'Account is suspended or inactive', 403);
        }
        // Entering the code proves inbox control → stamp email verified.
        await db.sequelize.query(
            'UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = :id',
            { replacements: { id: existing.id }, type: Q.UPDATE },
        ).catch(() => {});
        sessionUser = { id: existing.id, org_id: existing.orgId, email: existing.email };
        role = existing.role || 'viewer';
        isNewUser = false;
    } else {
        // Passwordless signup — same provisioning as social login (org + owner + subscription).
        const { user, org } = await signupService.provisionOAuthAccount(
            { email: normEmail, fullName: null, avatarUrl: null, provider: null, providerUserId: null },
            { ipAddress, userAgent },
        );
        sessionUser = { id: user.id, org_id: org.id, email: normEmail };
        role = 'owner';
        isNewUser = true;
    }

    const result = await sso.completeLogin({ user: sessionUser, role }, { ipAddress, userAgent });
    return { token: result.token, refreshToken: result.refreshToken, user: result.user, isNewUser };
}

/** Confirm a login code and return a full session. The OTP is consumed before the session is minted. */
async function verifyOtp({ email, code, ipAddress, userAgent }) {
    const normEmail = String(email).toLowerCase().trim();
    const [record] = await db.sequelize.query(
        'SELECT id, code_hash, attempts, expires_at FROM email_otps WHERE email = :e AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1',
        { replacements: { e: normEmail }, type: Q.SELECT },
    );

    const decision = classifyOtpAttempt(record, code, { maxAttempts: OTP.maxAttempts });
    const consume = (id) => db.sequelize.query('UPDATE email_otps SET consumed_at = now(), updated_at = now() WHERE id = :id', { replacements: { id }, type: Q.UPDATE });
    const bumpAttempts = (id, attempts, consumed) =>
        db.sequelize.query(`UPDATE email_otps SET attempts = :a, updated_at = now()${consumed ? ', consumed_at = now()' : ''} WHERE id = :id`, { replacements: { a: attempts, id }, type: Q.UPDATE });

    switch (decision.outcome) {
        case 'no_code':
            throw new AppError('OTP_NOT_FOUND', 'No active login code. Request a new one.', 400);
        case 'expired':
            await consume(record.id);
            throw new AppError('OTP_EXPIRED', 'Login code has expired. Request a new one.', 400);
        case 'locked':
            await consume(record.id);
            throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Request a new code.', 429);
        case 'invalid':
            await bumpAttempts(record.id, decision.attempts, decision.exhausted);
            throw new AppError('OTP_INVALID', decision.exhausted ? 'Incorrect code. Too many attempts — request a new code.' : 'Incorrect login code', 400);
        case 'ok':
        default:
            await bumpAttempts(record.id, decision.attempts, true); // consume FIRST — one code, one session
            return loginForEmail(normEmail, { ipAddress, userAgent });
    }
}

module.exports = { requestOtp, verifyOtp, classifyOtpAttempt, generateNumericCode, maskEmail };
