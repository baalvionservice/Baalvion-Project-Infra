'use strict';
/**
 * @file service/emailLoginService.js
 * @description Passwordless login via one-time email codes (works for every site that talks to
 * the central auth-service: admin, dashboard, CTM, Amarisé, GTI, …).
 *
 * Flow:
 *   1. POST /v1/auth/email/otp/request { email }  → a 6-digit code is emailed.
 *   2. POST /v1/auth/email/otp/verify  { email, code } → find-or-create the account (exactly like
 *      social login) and mint the SAME RS256 session as password login (authService.issueTokenPair).
 *
 * Security model (mirrors phone OTP + password-reset):
 *   • Codes are random numeric strings; only sha256(code) is persisted.
 *   • Each request invalidates the email's prior live codes — exactly one code is ever active.
 *   • A code is single-use (consumed_at), time-bound (expires_at) and attempt-bound (attempts).
 *   • A resend cooldown throttles sends per email (on top of the route's per-IP limiter).
 *   • Keyed by EMAIL (pre-auth): the user may not exist until verify creates them.
 *   • Successful verify proves email control → the account is marked email-verified.
 *   • MFA accounts are NOT allowed through this fast-path (mirrors social login): they must use
 *     password + second factor.
 */
const { v4: uuidv4 } = require('uuid');
const crypto = require('node:crypto');

const db = require('../models');
const { userRepo, orgRepo, sessionRepo, auditRepo } = require('../repositories');
const passwordUtil = require('../utils/password');
const { hashToken } = require('../utils/crypto');
const { sendMail, isMailerConfigured } = require('../utils/mailer');
const { generateNumericCode, classifyOtpAttempt } = require('./phoneVerificationService');
const { issueTokenPair, presentUser } = require('./authService');
const eventBus = require('../utils/eventBus');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const OTP = config.security.otp;

/** "j***@example.com" — never leak the full local part back to the caller. */
function maskEmail(email) {
    const [local = '', domain = ''] = String(email).split('@');
    const head = local.slice(0, 1);
    return `${head}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
}

const BRAND = process.env.OTP_EMAIL_BRAND || 'Baalvion';

function buildOtpEmail(code, minutes) {
    return {
        subject: `${code} is your ${BRAND} login code`,
        html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
                <h2 style="margin:0 0 16px">Sign in to ${BRAND}</h2>
                <p style="margin:0 0 8px">Use this one-time code to finish signing in:</p>
                <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:16px 0;color:#0b5cff">${code}</p>
                <p style="margin:0 0 4px;color:#555">This code expires in ${minutes} minutes.</p>
                <p style="margin:16px 0 0;color:#888;font-size:13px">If you didn't request this, you can safely ignore this email — no one can sign in without the code.</p>
            </div>`,
    };
}

/**
 * Issue (or re-issue) a one-time login code for an email address. Always succeeds for any
 * syntactically-valid email (find-or-create happens on verify, not here) — so there is no
 * account-enumeration signal. Abuse is bounded by the per-IP route limiter + per-email cooldown.
 * @param {{ email: string, ipAddress?: string }} input
 * @returns {Promise<{ sentTo: string, expiresAt: string, resendAvailableInSeconds: number }>}
 */
async function requestOtp({ email, ipAddress }) {
    const normEmail = String(email).toLowerCase().trim();

    // Delivery is the WHOLE point here — refuse loudly in production rather than silently
    // dropping the code into the dev console logger (which would strand the user).
    if (!isMailerConfigured() && config.env === 'production') {
        throw new AppError('EMAIL_DELIVERY_UNAVAILABLE', 'Email login is temporarily unavailable. Please use another sign-in method.', 503);
    }

    // Resend cooldown — throttle sends per email (defence-in-depth on top of the IP limiter).
    const latest = await db.EmailOtp.findOne({ where: { email: normEmail }, order: [['created_at', 'DESC']] });
    if (latest && !latest.consumed_at) {
        const elapsedMs = Date.now() - new Date(latest.created_at).getTime();
        const cooldownMs = OTP.resendCooldown * 1000;
        if (elapsedMs < cooldownMs) {
            const wait = Math.ceil((cooldownMs - elapsedMs) / 1000);
            throw new AppError('OTP_COOLDOWN', `Please wait ${wait}s before requesting another code`, 429);
        }
    }

    // Exactly one live code per email — burn any outstanding unconsumed codes.
    await db.EmailOtp.update({ consumed_at: new Date() }, { where: { email: normEmail, consumed_at: null } });

    const code = generateNumericCode(OTP.length);
    const expiresAt = new Date(Date.now() + OTP.ttlSeconds * 1000);
    const record = await db.EmailOtp.create({
        email:      normEmail,
        code_hash:  hashToken(code),
        purpose:    'login',
        expires_at: expiresAt,
    });

    const minutes = Math.round(OTP.ttlSeconds / 60);
    const { subject, html } = buildOtpEmail(code, minutes);
    try {
        // NOT fire-and-forget: a delivery failure must surface so the user can retry, and the
        // burned code is released so the cooldown does not block an immediate second attempt.
        await sendMail({ to: normEmail, subject, html });
    } catch (err) {
        await record.update({ consumed_at: new Date() }).catch(() => {});
        throw new AppError('EMAIL_SEND_FAILED', 'Could not send your login code. Please try again.', 502);
    }

    await auditRepo.append({ action: 'user.email_otp_requested', ipAddress, metadata: { email: maskEmail(normEmail) } }).catch(() => {});
    eventBus.publish('auth.email_otp_requested', { email: normEmail, expiresAt: expiresAt.toISOString() }).catch(() => {});

    return {
        sentTo:                   maskEmail(normEmail),
        expiresAt:                expiresAt.toISOString(),
        resendAvailableInSeconds: OTP.resendCooldown,
    };
}

/**
 * Find-or-create the user for a verified email and mint an RS256 session. Mirrors
 * oauthLogin.loginWithProfile: passwordless account, provisioned buyer org, same login gates.
 */
async function loginForEmail(normEmail, { ipAddress, userAgent }) {
    let user = await userRepo.findByEmail(normEmail);
    let isNewUser = false;
    let orgId = null;

    if (!user) {
        // Passwordless account — an unusable 'otp:'+random hash so password login can never match.
        const placeholderHash = await passwordUtil.hash('otp:' + crypto.randomBytes(24).toString('hex'));
        user = await userRepo.create({ email: normEmail, passwordHash: placeholderHash });
        await db.User.update({ email_verified_at: new Date() }, { where: { id: user.id } });
        const org = await orgRepo.create({ name: `${normEmail.split('@')[0]}'s Workspace`, ownerId: user.id, type: 'buyer' });
        await orgRepo.addMember({ orgId: org.id, userId: user.id, role: 'owner' });
        orgId = org.id;
        isNewUser = true;
    }

    if (user.status && user.status !== 'active') {
        throw new AppError('ACCOUNT_DISABLED', 'Account is suspended or inactive', 403);
    }

    if (!orgId) {
        const membership = await orgRepo.getPrimaryMembership(user.id);
        if (membership && membership.organization && membership.organization.status === 'suspended') {
            throw new AppError('ORG_SUSPENDED', 'Your organization is suspended. Contact the platform administrator.', 403);
        }
        orgId = membership ? membership.org_id : null;
        if (!orgId) {
            const org = await orgRepo.create({ name: `${normEmail.split('@')[0]}'s Workspace`, ownerId: user.id, type: 'buyer' });
            await orgRepo.addMember({ orgId: org.id, userId: user.id, role: 'owner' });
            orgId = org.id;
        }
    }

    // MFA gate — the OTP fast-path must NOT bypass MFA (mirrors login + social login).
    const fresh = await userRepo.findById(user.id);
    if (fresh && (fresh.mfa_enabled || (fresh.mfa_required && !fresh.mfa_enabled))) {
        throw new AppError('MFA_REQUIRED', 'This account uses multi-factor authentication. Please sign in with your email and password.', 409);
    }

    // Entering a code proves control of the inbox → mark the email verified for existing users too.
    if (fresh && !fresh.email_verified_at) await userRepo.setEmailVerified(user.id).catch(() => {});

    const session = await sessionRepo.create({ userId: user.id, orgId, ipAddress, userAgent });
    const tokens = await issueTokenPair(fresh || user, orgId, session.id, uuidv4());
    await userRepo.setLastLogin(user.id).catch(() => {});
    await auditRepo.append({ userId: user.id, orgId, action: isNewUser ? 'user.email_otp_register' : 'user.email_otp_login', ipAddress }).catch(() => {});

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(fresh || user, { orgId, orgType: tokens.orgType, role: tokens.role }),
        isNewUser,
    };
}

/**
 * Confirm a login code and return a full session. The OTP is consumed before the session is
 * minted so a code can never log in twice.
 * @param {{ email: string, code: string, ipAddress?: string, userAgent?: string }} input
 */
async function verifyOtp({ email, code, ipAddress, userAgent }) {
    const normEmail = String(email).toLowerCase().trim();
    const record = await db.EmailOtp.findOne({
        where: { email: normEmail, consumed_at: null },
        order: [['created_at', 'DESC']],
    });

    const decision = classifyOtpAttempt(record, code, { maxAttempts: OTP.maxAttempts });
    switch (decision.outcome) {
        case 'no_code':
            throw new AppError('OTP_NOT_FOUND', 'No active login code. Request a new one.', 400);
        case 'expired':
            await record.update({ consumed_at: new Date() });
            throw new AppError('OTP_EXPIRED', 'Login code has expired. Request a new one.', 400);
        case 'locked':
            await record.update({ consumed_at: new Date() });
            throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Request a new code.', 429);
        case 'invalid':
            await record.update({ attempts: decision.attempts, ...(decision.exhausted ? { consumed_at: new Date() } : {}) });
            await auditRepo.append({ action: 'user.email_otp_failed', ipAddress, metadata: { email: maskEmail(normEmail) } }).catch(() => {});
            throw new AppError('OTP_INVALID', decision.exhausted ? 'Incorrect code. Too many attempts — request a new code.' : 'Incorrect login code', 400);
        case 'ok':
        default:
            // Consume FIRST — a single code can never mint two sessions even under a race.
            await record.update({ attempts: decision.attempts, consumed_at: new Date() });
            return loginForEmail(normEmail, { ipAddress, userAgent });
    }
}

module.exports = { requestOtp, verifyOtp, maskEmail };
