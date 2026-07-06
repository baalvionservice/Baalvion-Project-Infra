'use strict';
const crypto = require('crypto');
const totp = require('../utils/totp');
const { recordAudit } = require('../utils/audit');
const db = require('../models');
const sessions = require('../services/sessionService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

const REFRESH_COOKIE = 'refresh_token';
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, { path: '/' });
const presentedRefreshToken = (req) => (req.cookies && req.cookies[REFRESH_COOKIE]) || req.body?.refreshToken || null;

const serializeSession = (row, currentId) => ({
    id: row.id,
    current: row.id === currentId,
    userAgent: row.user_agent || null,
    ip: row.ip || null,
    createdAt: row.createdAt, // Sequelize timestamp attribute is camelCase
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
});

// GONE (Phase 6E-8 / auth-node R2): access-token issuance is RS256-only and the
// RS256 private key lives ONLY in the central identity/auth-service — trade-service
// is a verify-only participant (JWKS public key) and structurally cannot mint a
// token. `utils/jwtserver.js::signAccessToken` — and the underlying
// `@baalvion/auth-node` HS256 `signAccessToken` it wraps — throw unconditionally
// by design (no env var re-enables it; rollback = deployment revert). Before this
// fix, register/login/refresh ran their full body (bcrypt hash, User.create,
// lockout bookkeeping) and only failed at the LAST step (issuing the token),
// which both 500'd every real caller and, for register specifically, left a
// half-created User row behind — every retry then hit the 409 duplicate-email
// branch, permanently bricking that email address. Retiring these three actions
// up front (mirrors the orderRoutes.js / paymentRoutes.js precedent — HTTP surface
// retired, no writes attempted) fixes both the 500 and the data-corruption side
// effect. `/me`, `/mfa/*`, `/logout`, `/sessions*` are untouched — none of them
// mint a token, so they still work against a gateway-verified identity. The real
// GTI frontend already bypasses this file entirely (api-client.ts routes through
// `/trade-bff/auth/*` → auth-gateway → auth-service), so nothing live regresses.
const AUTH_GONE = new AppError(
    'GONE',
    'Token issuance is centralized in the identity/auth-service (RS256) — authenticate via auth-gateway, not trade-service directly.',
    410,
);

const register = async (req, res, next) => next(AUTH_GONE);
const login = async (req, res, next) => next(AUTH_GONE);

// Consume a one-time backup code (hashed). Returns true if matched + burned.
const consumeBackupCode = async (user, code) => {
    const codes = Array.isArray(user.mfa_backup_codes) ? user.mfa_backup_codes : [];
    const h = sha256(code);
    if (!codes.includes(h)) return false;
    await user.update({ mfa_backup_codes: codes.filter((c) => c !== h) });
    return true;
};

const me = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.auth.userId, {
            attributes: { exclude: ['password_hash', 'mfa_secret', 'mfa_backup_codes'] },
        });
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        return sendSuccess(req, res, user);
    } catch (err) { return next(err); }
};

// --- MFA (TOTP) -----------------------------------------------------------

// Begin enrollment: issue a secret + otpauth URI (for QR) + one-time backup codes.
const enrollMfa = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.auth.userId);
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        const secret = totp.generateSecret();
        const backupCodes = totp.generateBackupCodes();
        await user.update({ mfa_secret: secret, mfa_enabled: false, mfa_backup_codes: backupCodes.map(sha256) });
        await recordAudit({ actorId: user.id, action: 'mfa.enroll_started', resourceType: 'user', resourceId: user.id, tenantId: user.tenant_id });
        // backupCodes returned in plaintext ONCE; only hashes are stored.
        return sendSuccess(req, res, { secret, otpauthUri: totp.otpauthURI(secret, user.email), backupCodes });
    } catch (err) { return next(err); }
};

// Confirm enrollment by verifying the first TOTP code → activates MFA.
const verifyMfa = async (req, res, next) => {
    try {
        const { code } = req.body;
        const user = await db.User.findByPk(req.auth.userId);
        if (!user || !user.mfa_secret) return next(new AppError('BAD_REQUEST', 'Begin enrollment first', 400));
        if (!totp.verify(user.mfa_secret, code)) return next(new AppError('UNAUTHORIZED', 'Invalid verification code', 401));
        await user.update({ mfa_enabled: true });
        await recordAudit({ actorId: user.id, action: 'mfa.enabled', resourceType: 'user', resourceId: user.id, tenantId: user.tenant_id });
        return sendSuccess(req, res, { mfaEnabled: true });
    } catch (err) { return next(err); }
};

const disableMfa = async (req, res, next) => {
    try {
        const { code } = req.body;
        const user = await db.User.findByPk(req.auth.userId);
        if (!user) return next(new AppError('NOT_FOUND', 'User not found', 404));
        if (user.mfa_enabled && !totp.verify(user.mfa_secret, code) && !(await consumeBackupCode(user, code))) {
            return next(new AppError('UNAUTHORIZED', 'Invalid code', 401));
        }
        await user.update({ mfa_enabled: false, mfa_secret: null, mfa_backup_codes: [] });
        await recordAudit({ actorId: user.id, action: 'mfa.disabled', resourceType: 'user', resourceId: user.id, tenantId: user.tenant_id });
        return sendSuccess(req, res, { mfaEnabled: false });
    } catch (err) { return next(err); }
};

// --- Refresh-token sessions ----------------------------------------------

// GONE — see AUTH_GONE above: rotating a refresh token ends in the same
// unmintable-access-token dead end as register/login.
const refresh = async (req, res, next) => next(AUTH_GONE);

// Logout: revoke the presented session and clear the cookie. Idempotent.
const logout = async (req, res, next) => {
    try {
        const token = presentedRefreshToken(req);
        if (token) await sessions.revokeByToken(token);
        clearRefreshCookie(res);
        if (req.auth?.userId) {
            await recordAudit({ actorId: req.auth.userId, action: 'auth.logout', resourceType: 'session', resourceId: req.auth.userId, tenantId: req.auth.tenantId });
        }
        return sendSuccess(req, res, { loggedOut: true });
    } catch (err) { return next(err); }
};

// List the caller's active sessions (device/session management UI).
const listSessions = async (req, res, next) => {
    try {
        const parsed = presentedRefreshToken(req);
        const currentId = parsed ? String(parsed).split('.')[0] : null;
        const rows = await sessions.listActive(req.auth.userId);
        return sendSuccess(req, res, rows.map((r) => serializeSession(r, currentId)));
    } catch (err) { return next(err); }
};

// Revoke a specific session by id (must belong to the caller).
const revokeSession = async (req, res, next) => {
    try {
        const ok = await sessions.revokeById(req.params.id, req.auth.userId);
        if (!ok) return next(new AppError('NOT_FOUND', 'Session not found', 404));
        await recordAudit({ actorId: req.auth.userId, action: 'auth.session_revoked', resourceType: 'session', resourceId: req.params.id, tenantId: req.auth.tenantId });
        return sendSuccess(req, res, { revoked: true });
    } catch (err) { return next(err); }
};

// Revoke every session for the caller ("sign out everywhere").
const revokeAllSessions = async (req, res, next) => {
    try {
        const count = await sessions.revokeAllForUser(req.auth.userId);
        clearRefreshCookie(res);
        await recordAudit({ actorId: req.auth.userId, action: 'auth.session_revoked_all', resourceType: 'session', resourceId: req.auth.userId, tenantId: req.auth.tenantId, metadata: { count } });
        return sendSuccess(req, res, { revoked: count });
    } catch (err) { return next(err); }
};

module.exports = {
    register, login, me, enrollMfa, verifyMfa, disableMfa,
    refresh, logout, listSessions, revokeSession, revokeAllSessions,
};
