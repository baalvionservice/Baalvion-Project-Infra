'use strict';
/**
 * @file service/phoneVerificationService.js
 * @description Phone-number verification via one-time SMS codes (public buyer/seller self-service).
 *
 * Security model (mirrors the email-verification + password-reset flows):
 *   • Codes are random numeric strings; only sha256(code) is persisted (utils/crypto.hashToken).
 *   • Each request invalidates the user's prior live codes — exactly one code is ever active.
 *   • A code is single-use (consumed_at), time-bound (expires_at) and attempt-bound (attempts).
 *   • A resend cooldown throttles SMS sends per user (in addition to the route IP rate-limiter).
 * Delivery is best-effort and never blocks the flow — a send failure leaves the code valid.
 */
const crypto = require('node:crypto');

const db = require('../models');
const { userRepo, auditRepo } = require('../repositories');
const { hashToken } = require('../utils/crypto');
const { sendSms, maskPhone } = require('../utils/sms');
const eventBus = require('../utils/eventBus');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const OTP = config.security.otp;

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

/** Constant-time compare of two hex digests. */
function safeEqualHex(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
        return false;
    }
}

/**
 * Pure decision for a verify attempt — no I/O, so it is exhaustively unit-testable. The caller
 * applies the side effects (consume / increment attempts / mark verified) from the outcome.
 * @param {object|null} record  The live OTP row (or null when none exists).
 * @param {string}      code    The submitted code.
 * @param {{ nowMs?: number, maxAttempts?: number }} [opts]
 * @returns {{ outcome: 'no_code'|'expired'|'locked'|'invalid'|'ok', attempts: number, exhausted: boolean }}
 */
function classifyOtpAttempt(record, code, { nowMs = Date.now(), maxAttempts = OTP.maxAttempts } = {}) {
    if (!record) return { outcome: 'no_code', attempts: 0, exhausted: false };
    if (nowMs > new Date(record.expires_at).getTime()) return { outcome: 'expired', attempts: record.attempts, exhausted: false };
    if (record.attempts >= maxAttempts) return { outcome: 'locked', attempts: record.attempts, exhausted: true };

    // Count this attempt BEFORE the comparison so a wrong guess always burns a try.
    const attempts = record.attempts + 1;
    const matches = safeEqualHex(hashToken(String(code)), record.code_hash);
    if (!matches) return { outcome: 'invalid', attempts, exhausted: attempts >= maxAttempts };
    return { outcome: 'ok', attempts, exhausted: false };
}

/**
 * Issue (or re-issue) a verification code for the authenticated user's phone.
 * @param {object} input
 * @param {string|number} input.userId   The authenticated user.
 * @param {string}        [input.phone]  Target number; falls back to the user's stored phone.
 * @param {string}        [input.ipAddress]
 * @returns {Promise<{ sentTo: string, expiresAt: string, resendAvailableInSeconds: number }>}
 */
async function requestOtp({ userId, phone, ipAddress }) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const targetPhone = (phone || user.phone || '').trim();
    if (!targetPhone) throw new AppError('PHONE_REQUIRED', 'A phone number is required to send a code', 400);
    if (user.phone_verified_at && user.phone === targetPhone) {
        throw new AppError('PHONE_ALREADY_VERIFIED', 'This phone number is already verified', 409);
    }

    // Resend cooldown — throttle SMS sends per user (defence-in-depth on top of the IP limiter).
    const latest = await db.PhoneOtp.findOne({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
    if (latest) {
        const elapsedMs = Date.now() - new Date(latest.created_at).getTime();
        const cooldownMs = OTP.resendCooldown * 1000;
        if (elapsedMs < cooldownMs) {
            const wait = Math.ceil((cooldownMs - elapsedMs) / 1000);
            throw new AppError('OTP_COOLDOWN', `Please wait ${wait}s before requesting another code`, 429);
        }
    }

    // Exactly one live code per user — burn any outstanding unconsumed codes.
    await db.PhoneOtp.update({ consumed_at: new Date() }, { where: { user_id: user.id, consumed_at: null } });

    const code = generateNumericCode(OTP.length);
    const expiresAt = new Date(Date.now() + OTP.ttlSeconds * 1000);
    await db.PhoneOtp.create({
        user_id:    user.id,
        phone:      targetPhone,
        code_hash:  hashToken(code),
        purpose:    'verify',
        expires_at: expiresAt,
    });

    // Associate the (still unverified) number with the user so a later verify can match it.
    if (user.phone !== targetPhone) await userRepo.setPhone(user.id, targetPhone);

    const minutes = Math.round(OTP.ttlSeconds / 60);
    sendSms({
        to:   targetPhone,
        body: `Your Baalvion verification code is ${code}. It expires in ${minutes} minutes. Do not share it.`,
    }).catch(() => { /* delivery is best-effort; the code stays valid for a resend */ });

    await auditRepo.append({ userId: user.id, action: 'user.phone_otp_requested', ipAddress, metadata: { phone: maskPhone(targetPhone) } });
    eventBus.publish('auth.phone_otp_requested', {
        userId:    String(user.id),
        phone:     targetPhone,
        expiresAt: expiresAt.toISOString(),
    }).catch(() => {});

    return {
        sentTo:                   maskPhone(targetPhone),
        expiresAt:                expiresAt.toISOString(),
        resendAvailableInSeconds: OTP.resendCooldown,
    };
}

/**
 * Confirm a verification code and mark the user's phone verified.
 * @param {object} input
 * @param {string|number} input.userId
 * @param {string}        input.code
 * @param {string}        [input.ipAddress]
 * @returns {Promise<{ phone: string, phoneVerified: true }>}
 */
async function verifyOtp({ userId, code, ipAddress }) {
    const record = await db.PhoneOtp.findOne({
        where: { user_id: userId, consumed_at: null },
        order: [['created_at', 'DESC']],
    });

    const decision = classifyOtpAttempt(record, code, { maxAttempts: OTP.maxAttempts });
    switch (decision.outcome) {
        case 'no_code':
            throw new AppError('OTP_NOT_FOUND', 'No active verification code. Request a new one.', 400);
        case 'expired':
            await record.update({ consumed_at: new Date() });
            throw new AppError('OTP_EXPIRED', 'Verification code has expired. Request a new one.', 400);
        case 'locked':
            await record.update({ consumed_at: new Date() });
            throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Request a new code.', 429);
        case 'invalid':
            await record.update({ attempts: decision.attempts, ...(decision.exhausted ? { consumed_at: new Date() } : {}) });
            await auditRepo.append({ userId, action: 'user.phone_otp_failed', ipAddress });
            throw new AppError('OTP_INVALID', decision.exhausted ? 'Incorrect code. Too many attempts — request a new code.' : 'Incorrect verification code', 400);
        case 'ok':
        default:
            await record.update({ attempts: decision.attempts, consumed_at: new Date() });
            await userRepo.setPhoneVerified(userId, record.phone);
            await auditRepo.append({ userId, action: 'user.phone_verified', ipAddress, metadata: { phone: maskPhone(record.phone) } });
            eventBus.publish('auth.phone_verified', { userId: String(userId), phone: record.phone }).catch(() => {});
            return { phone: record.phone, phoneVerified: true };
    }
}

module.exports = { requestOtp, verifyOtp, generateNumericCode, classifyOtpAttempt };
