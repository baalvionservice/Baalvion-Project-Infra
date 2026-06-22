'use strict';
/**
 * @file service/emailLoginService.js
 * @description Passwordless sign-in / sign-up via one-time email codes (works for every site that
 * talks to the central auth-service: baalvion.com, about, dashboard, CTM, Amarisé, GTI, …).
 *
 * Flow:
 *   1. POST /v1/auth/email/otp/request { firstName, lastName, email, captchaToken }
 *        → bot/genuine-email gates run, then a 6-digit code is emailed (greeting the user by name).
 *   2. POST /v1/auth/email/otp/verify  { email, code }
 *        → find-or-create the account (exactly like social login) using the name BOUND to the code,
 *          and mint the SAME RS256 session as password login (authService.issueTokenPair).
 *
 * Security model (mirrors phone OTP + password-reset, hardened for a public surface):
 *   • Cloudflare Turnstile verifies the request is human (enforced whenever a secret is configured).
 *   • Disposable/temp inboxes are rejected; the domain must be deliverable (MX → A/AAAA) before send.
 *   • Codes are random numeric strings; only sha256(code) is persisted.
 *   • Each request invalidates the email's prior live codes — exactly one code is ever active.
 *   • A code is single-use (consumed_at), time-bound (5-minute expiry) and attempt-bound (attempts).
 *   • A per-email resend COOLDOWN throttles back-to-back sends; a per-email resend HARD CAP bounds
 *     total sends within a window; a per-IP route limiter caps email-bombing across addresses.
 *   • The name is captured at REQUEST and bound to the code (not re-sent at verify) → not spoofable.
 *   • Successful verify proves email control → the account is marked email-verified.
 *   • MFA accounts are NOT allowed through this fast-path (mirrors social login).
 */
const { v4: uuidv4 } = require('uuid');
const crypto = require('node:crypto');
const { Op } = require('sequelize');

const db = require('../models');
const { userRepo, orgRepo, sessionRepo, auditRepo } = require('../repositories');
const passwordUtil = require('../utils/password');
const { hashToken } = require('../utils/crypto');
const { sendMail, isMailerConfigured } = require('../utils/mailer');
const { generateNumericCode, classifyOtpAttempt } = require('./phoneVerificationService');
const { assertGenuineEmail } = require('../utils/emailValidation');
const { verifyTurnstile } = require('../utils/captcha');
const { issueTokenPair, presentUser } = require('./authService');
const eventBus = require('../utils/eventBus');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');

const OTP = config.security.emailOtp;

/** "j***@example.com" — never leak the full local part back to the caller. */
function maskEmail(email) {
    const [local = '', domain = ''] = String(email).split('@');
    const head = local.slice(0, 1);
    return `${head}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
}

/** Escape user-supplied text before interpolating into the HTML email (defence-in-depth on top of
 *  the name schema, which already forbids angle brackets). */
function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

const BRAND = process.env.OTP_EMAIL_BRAND || 'Baalvion';
const BRAND_ACCENT = process.env.OTP_EMAIL_ACCENT || '#FF9900'; // Baalvion orange

function buildOtpEmail(code, minutes, firstName) {
    const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi,';
    return {
        subject: `${code} is your ${BRAND} verification code`,
        html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
                <h2 style="margin:0 0 16px">Sign in to ${BRAND}</h2>
                <p style="margin:0 0 8px">${greeting}</p>
                <p style="margin:0 0 8px">Use this one-time code to finish signing in:</p>
                <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:16px 0;color:${BRAND_ACCENT}">${code}</p>
                <p style="margin:0 0 4px;color:#555">This code expires in ${minutes} minutes.</p>
                <p style="margin:16px 0 0;color:#888;font-size:13px">If you didn't request this, you can safely ignore this email — no one can sign in without the code.</p>
            </div>`,
    };
}

/**
 * Issue (or re-issue) a one-time login code for an email address. Find-or-create happens on verify,
 * so any genuine, deliverable, non-disposable email always succeeds here — there is no
 * account-enumeration signal. Abuse is bounded by Turnstile + the per-IP route limiter + the
 * per-email cooldown + the per-email resend hard cap.
 * @param {{ email: string, firstName?: string, lastName?: string, captchaToken?: string, ipAddress?: string }} input
 * @returns {Promise<{ sentTo: string, expiresAt: string, resendAvailableInSeconds: number, resendsRemaining: number }>}
 */
async function requestOtp({ email, firstName, lastName, captchaToken, ipAddress }) {
    const normEmail = String(email).toLowerCase().trim();
    const first = firstName ? String(firstName).trim() : null;
    const last  = lastName  ? String(lastName).trim()  : null;

    // 1 — Bot defence. verifyTurnstile returns true when no secret is configured (local dev).
    const human = await verifyTurnstile(captchaToken, ipAddress);
    if (!human) throw new AppError('CAPTCHA_FAILED', 'Captcha verification failed. Please try again.', 400);

    // 2 — Genuine-email gate: reject disposable inboxes + require a deliverable domain BEFORE sending.
    await assertGenuineEmail(normEmail);

    // 3 — Delivery is the WHOLE point here — refuse loudly in production rather than silently
    //     dropping the code into the dev console logger (which would strand the user).
    if (!isMailerConfigured() && config.env === 'production') {
        throw new AppError('EMAIL_DELIVERY_UNAVAILABLE', 'Email sign-in is temporarily unavailable. Please use another sign-in method.', 503);
    }

    // 4 — Hard cap on resends: bound the number of codes ever sent to one address within a window
    //     (on top of the cooldown + IP limiter). Counts every send (live, burned, or consumed).
    const windowStart = new Date(Date.now() - OTP.resendWindowSeconds * 1000);
    const sendsInWindow = await db.EmailOtp.count({ where: { email: normEmail, created_at: { [Op.gte]: windowStart } } });
    if (sendsInWindow >= OTP.maxResends + 1) {
        const minutes = Math.ceil(OTP.resendWindowSeconds / 60);
        throw new AppError('OTP_RESEND_LIMIT', `You've reached the maximum number of code requests. Please try again in about ${minutes} minutes.`, 429);
    }

    // 5 — Resend cooldown — throttle back-to-back sends per email (defence-in-depth on the IP limiter).
    const latest = await db.EmailOtp.findOne({ where: { email: normEmail }, order: [['created_at', 'DESC']] });
    if (latest && !latest.consumed_at) {
        const elapsedMs = Date.now() - new Date(latest.created_at).getTime();
        const cooldownMs = OTP.resendCooldown * 1000;
        if (elapsedMs < cooldownMs) {
            const wait = Math.ceil((cooldownMs - elapsedMs) / 1000);
            throw new AppError('OTP_COOLDOWN', `Please wait ${wait}s before requesting another code`, 429);
        }
    }

    // 6 — Exactly one live code per email — burn any outstanding unconsumed codes.
    await db.EmailOtp.update({ consumed_at: new Date() }, { where: { email: normEmail, consumed_at: null } });

    const code = generateNumericCode(OTP.length);
    const expiresAt = new Date(Date.now() + OTP.ttlSeconds * 1000);
    const record = await db.EmailOtp.create({
        email:      normEmail,
        first_name: first,
        last_name:  last,
        code_hash:  hashToken(code),
        purpose:    'login',
        expires_at: expiresAt,
    });

    const minutes = Math.round(OTP.ttlSeconds / 60);
    const { subject, html } = buildOtpEmail(code, minutes, first);
    try {
        // NOT fire-and-forget: a delivery failure must surface so the user can retry, and the
        // burned code is released so the cooldown does not block an immediate second attempt.
        await sendMail({ to: normEmail, subject, html });
    } catch (err) {
        await record.update({ consumed_at: new Date() }).catch(() => {});
        throw new AppError('EMAIL_SEND_FAILED', 'Could not send your code. Please try again.', 502);
    }

    await auditRepo.append({ action: 'user.email_otp_requested', ipAddress, metadata: { email: maskEmail(normEmail) } }).catch(() => {});
    eventBus.publish('auth.email_otp_requested', { email: normEmail, expiresAt: expiresAt.toISOString() }).catch(() => {});

    return {
        sentTo:                   maskEmail(normEmail),
        expiresAt:                expiresAt.toISOString(),
        resendAvailableInSeconds: OTP.resendCooldown,
        // How many MORE codes the user may request in this window (this send already counted).
        resendsRemaining:         Math.max(0, OTP.maxResends - sendsInWindow),
    };
}

/**
 * Find-or-create the user for a verified email and mint an RS256 session. Mirrors
 * oauthLogin.loginWithProfile: passwordless account, provisioned buyer org, same login gates. The
 * name (bound to the code at request time) is used to create / backfill the account.
 */
async function loginForEmail(normEmail, { firstName, lastName, ipAddress, userAgent }) {
    let user = await userRepo.findByEmail(normEmail);
    let isNewUser = false;
    let orgId = null;

    if (!user) {
        // Passwordless account — an unusable 'otp:'+random hash so password login can never match.
        const placeholderHash = await passwordUtil.hash('otp:' + crypto.randomBytes(24).toString('hex'));
        user = await userRepo.create({ email: normEmail, passwordHash: placeholderHash, firstName, lastName });
        await db.User.update({ email_verified_at: new Date() }, { where: { id: user.id } });
        const workspaceLabel = firstName ? `${firstName}'s Workspace` : `${normEmail.split('@')[0]}'s Workspace`;
        const org = await orgRepo.create({ name: workspaceLabel, ownerId: user.id, type: 'buyer' });
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
        // Existing nameless account (e.g. created by an older flow) — backfill the name they just gave.
        await userRepo.setNamesIfMissing(user.id, { firstName, lastName }).catch(() => {});
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
 * minted so a code can never log in twice. The name used to provision the account comes from the
 * code record (bound at request) — verify only carries email + code.
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
            throw new AppError('OTP_NOT_FOUND', 'No active code. Request a new one.', 400);
        case 'expired':
            await record.update({ consumed_at: new Date() });
            throw new AppError('OTP_EXPIRED', 'Your code has expired. Request a new one.', 400);
        case 'locked':
            await record.update({ consumed_at: new Date() });
            throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Too many incorrect attempts. Request a new code.', 429);
        case 'invalid':
            await record.update({ attempts: decision.attempts, ...(decision.exhausted ? { consumed_at: new Date() } : {}) });
            await auditRepo.append({ action: 'user.email_otp_failed', ipAddress, metadata: { email: maskEmail(normEmail) } }).catch(() => {});
            throw new AppError('OTP_INVALID', decision.exhausted ? 'Incorrect code. Too many attempts — request a new code.' : 'Incorrect code', 400);
        case 'ok':
        default:
            // Consume FIRST — a single code can never mint two sessions even under a race.
            await record.update({ attempts: decision.attempts, consumed_at: new Date() });
            return loginForEmail(normEmail, {
                firstName: record.first_name,
                lastName:  record.last_name,
                ipAddress,
                userAgent,
            });
    }
}

module.exports = { requestOtp, verifyOtp, maskEmail };
