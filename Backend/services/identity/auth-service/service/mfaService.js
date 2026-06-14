'use strict';
/**
 * MFA TOTP service.
 *
 * Login with MFA enabled is a two-step dance:
 *  1. POST /login  → returns { mfa_required: true, challengeToken }
 *  2. POST /mfa/challenge → verifies TOTP code, returns full token pair
 *
 * The challengeToken is a random opaque token stored in Redis for 5 minutes.
 * It is single-use: consumed on the first successful TOTP verify.
 *
 * Brute-force:  Max 5 failed TOTP attempts per challengeToken before it is
 *               revoked and the user must re-authenticate with password.
 */
const speakeasy  = require('speakeasy');
const QRCode     = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../utils/crypto');
const { AppError }      = require('../utils/errors');
const logger            = require('../utils/logger');

const MAX_MFA_ATTEMPTS = 5;
const CHALLENGE_TTL    = 5 * 60; // seconds

// ── Redis key helpers ──────────────────────────────────────────────────────────
const K = {
    challenge: (t)  => `auth:mfa_chal:${t}`,
    attempts:  (t)  => `auth:mfa_att:${t}`,
};

let _redis; // lazy — set on first call via getRedis()
function getRedis() {
    if (!_redis) _redis = require('../config/redis');
    return _redis;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function _storeChallenge(token, payload) {
    const r = getRedis();
    const client = r.getClient();
    if (!client || !r.isAvailable()) return; // in-memory fallback below
    await client.set(K.challenge(token), JSON.stringify(payload), 'EX', CHALLENGE_TTL);
}

async function _loadChallenge(token) {
    const r = getRedis();
    const client = r.getClient();
    if (!client || !r.isAvailable()) return _memChallenges.get(token) ?? null;
    const raw = await client.get(K.challenge(token));
    return raw ? JSON.parse(raw) : null;
}

async function _deleteChallenge(token) {
    const r = getRedis();
    const client = r.getClient();
    if (client && r.isAvailable()) await client.del(K.challenge(token), K.attempts(token));
    _memChallenges.delete(token);
}

async function _incrAttempts(token) {
    const r = getRedis();
    const client = r.getClient();
    if (!client || !r.isAvailable()) {
        const cur = (_memAttempts.get(token) || 0) + 1;
        _memAttempts.set(token, cur);
        return cur;
    }
    const [[, count]] = await client.pipeline()
        .incr(K.attempts(token))
        .expire(K.attempts(token), CHALLENGE_TTL)
        .exec();
    return count ?? 1;
}

// ── In-memory fallback (dev without Redis) ─────────────────────────────────────
const _memChallenges = new Map();
const _memAttempts   = new Map();

/**
 * Reads a challenge without consuming it — lets callers load the user
 * before calling verifyChallenge (which enforces limits + deletes on success).
 */
async function peekChallenge(token) {
    return _loadChallenge(token);
}

/**
 * Consumes (deletes) a challenge without TOTP verification. Used by the MFA-enrollment
 * flow, where the code has already been confirmed against the pending secret via
 * confirmSetup() and we just need to burn the single-use enrollment challenge.
 */
async function consumeChallenge(token) {
    await _deleteChallenge(token);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Creates a short-lived challenge token after successful password check.
 * Returns the opaque token to embed in the partial-login response.
 */
async function createChallenge({ userId, orgId, ipAddress, userAgent }) {
    const token = generateToken(24); // 48-char hex
    const payload = { userId, orgId, ipAddress, userAgent, createdAt: Date.now() };

    await _storeChallenge(token, payload);
    _memChallenges.set(token, payload);

    logger.debug({ userId, event: 'mfa.challenge_created' }, 'MFA challenge issued');
    return token;
}

/**
 * Verifies a TOTP code against the challenge token.
 * Enforces attempt limits. Deletes the challenge on success (single-use).
 * Returns the stored challenge payload so the caller can issue tokens.
 */
async function verifyChallenge(challengeToken, totpCode, user) {
    if (!challengeToken) throw new AppError('MFA_CHALLENGE_REQUIRED', 'MFA challenge token is required', 400);

    const challenge = await _loadChallenge(challengeToken);
    if (!challenge) {
        throw new AppError('MFA_CHALLENGE_EXPIRED', 'MFA challenge expired or invalid. Please log in again.', 401);
    }

    const attempts = await _incrAttempts(challengeToken);
    if (attempts > MAX_MFA_ATTEMPTS) {
        await _deleteChallenge(challengeToken);
        logger.warn({ userId: user.id, attempts, event: 'mfa.brute_force' }, 'MFA challenge revoked — too many attempts');
        throw new AppError('MFA_LOCKED', 'Too many failed MFA attempts. Please log in again.', 429);
    }

    const valid = speakeasy.totp.verify({
        secret:   user.mfa_secret,
        encoding: 'base32',
        token:    totpCode,
        window:   1, // allow 30s clock drift
    });

    if (!valid) {
        logger.warn({ userId: user.id, attempts, event: 'mfa.invalid_code' }, 'Invalid TOTP code');
        throw new AppError('INVALID_MFA_CODE', `Invalid MFA code (${MAX_MFA_ATTEMPTS - attempts} attempts remaining)`, 401);
    }

    // Single-use: destroy the challenge immediately on success
    await _deleteChallenge(challengeToken);
    logger.info({ userId: user.id, event: 'mfa.verified' }, 'MFA challenge passed');
    return challenge; // { userId, orgId, ipAddress, userAgent }
}

/**
 * Generates a new TOTP secret for a user who is about to set up MFA.
 * The secret is stored as `mfa_pending_secret` — not activated until
 * the user confirms with a valid TOTP code via verifySetup().
 */
async function initiateSetup(user) {
    const secret = speakeasy.generateSecret({
        name:   `Baalvion (${user.email})`,
        length: 20,
    });

    // Back-codes for account recovery
    const recoveryCodes = Array.from({ length: 8 }, () => generateToken(4));
    const qrCodeUrl     = await QRCode.toDataURL(secret.otpauth_url);

    logger.debug({ userId: user.id, event: 'mfa.setup_initiated' }, 'MFA setup initiated');
    return { qrCodeUrl, secret: secret.base32, recoveryCodes };
}

/**
 * Confirms a TOTP code against the pending secret, then activates MFA.
 * Returns true on success, throws AppError on invalid code.
 */
function confirmSetup(pendingSecret, totpCode) {
    const valid = speakeasy.totp.verify({
        secret:   pendingSecret,
        encoding: 'base32',
        token:    totpCode,
        window:   1,
    });
    if (!valid) throw new AppError('INVALID_MFA_CODE', 'Verification code is incorrect', 400);
    return true;
}

module.exports = {
    createChallenge,
    peekChallenge,
    consumeChallenge,
    verifyChallenge,
    initiateSetup,
    confirmSetup,
};
