const authService = require('../service/authService');
const phoneVerification = require('../service/phoneVerificationService');
const emailLogin = require('../service/emailLoginService');
const schemas = require('../validators/schemas');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const { issueOnBehalf: issueOnBehalfSvc } = require('../service/issueOnBehalf');

const parseClientInfo = (req) => ({
    ipAddress: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
});

exports.register = async (req, res, next) => {
    try {
        const parsed = schemas.register.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.register({ ...parsed.data, ...parseClientInfo(req) });
        res.cookie(config.refreshCookieName, result.refreshToken, { httpOnly: true, secure: config.env === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        sendSuccess(req, res, { accessToken: result.accessToken, user: result.user, org: result.org }, 201);
    } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
    try {
        const parsed = schemas.login.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.login({ ...parsed.data, ...parseClientInfo(req) });
        // Second-factor continuation paths — no session/cookie yet, relay the challenge token.
        if (result.mfa_required) {
            return sendSuccess(req, res, { mfa_required: true, challengeToken: result.challengeToken });
        }
        if (result.mfa_enrollment_required) {
            return sendSuccess(req, res, { mfa_enrollment_required: true, challengeToken: result.challengeToken });
        }
        res.cookie(config.refreshCookieName, result.refreshToken, { httpOnly: true, secure: config.env === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        req.audit?.log('login_success', { userId: result.user?.id, orgId: result.user?.orgId, metadata: { email: parsed.data.email } });
        sendSuccess(req, res, { accessToken: result.accessToken, user: result.user, expiresAt: result.expiresAt });
    } catch (err) {
        req.audit?.log('login_failure', { metadata: { email: req.body?.email, reason: err.code || 'error' } });
        next(err);
    }
};

// Internal S2S (dual-issue window). Guarded by internalAuth (HMAC). Mints a canonical token
// for a user an island service has already authenticated locally. See service/issueOnBehalf.js.
exports.issueOnBehalf = async (req, res, next) => {
    try {
        const { email } = req.body || {};
        if (!email) throw new AppError('VALIDATION_ERROR', 'email is required', 400);
        const result = await issueOnBehalfSvc({ email, service: req.internalService, ...parseClientInfo(req) });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.mfaChallenge = async (req, res, next) => {
    try {
        const parsed = schemas.mfaChallenge.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.completeMfaLogin({ ...parsed.data, ...parseClientInfo(req) });
        res.cookie(config.refreshCookieName, result.refreshToken, { httpOnly: true, secure: config.env === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        sendSuccess(req, res, { accessToken: result.accessToken, user: result.user, expiresAt: result.expiresAt });
    } catch (err) { next(err); }
};

// Force-MFA enrolment step 1: generate (but do not yet activate) a pending TOTP secret for the
// challenge holder. Public — keyed by the enrollment challenge token, not a session. Returns the
// provisioning material (QR + secret + recovery codes) without consuming the challenge.
exports.enrollMfaStart = async (req, res, next) => {
    try {
        const parsed = schemas.mfaEnrollStart.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.enrollMfaStart(parsed.data.challengeToken);
        sendSuccess(req, res, { qrCodeUrl: result.qrCodeUrl, secret: result.secret, recoveryCodes: result.recoveryCodes });
    } catch (err) { next(err); }
};

// Force-MFA enrolment step 2: confirm the 6-digit code, activate MFA, consume the challenge and
// auto-log-in (full token pair). Mirrors login/acceptInvite — sets the refresh cookie.
exports.enrollMfa = async (req, res, next) => {
    try {
        const parsed = schemas.mfaEnroll.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.enrollMfaComplete({ ...parsed.data, ...parseClientInfo(req) });
        res.cookie(config.refreshCookieName, result.refreshToken, { httpOnly: true, secure: config.env === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        req.audit?.log('mfa_enrolled', { userId: result.user?.id, orgId: result.user?.orgId });
        sendSuccess(req, res, { accessToken: result.accessToken, user: result.user, expiresAt: result.expiresAt }, 201);
    } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
    try {
        // CR-13/M-3: refresh tokens are accepted ONLY from the HttpOnly cookie,
        // never from the request body (which is reachable via XSS / logs).
        const rawToken = req.cookies?.[config.refreshCookieName];
        const result = await authService.refresh(rawToken, req.ip);
        res.cookie(config.refreshCookieName, result.refreshToken, { httpOnly: true, secure: config.env === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        req.audit?.log('refresh', { userId: result.userId ?? result.user?.id ?? null });
        sendSuccess(req, res, { accessToken: result.accessToken, expiresAt: result.expiresAt });
    } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.[config.refreshCookieName] || req.body?.refreshToken;
        await authService.logout(req.auth?.sessionId, rawToken, req.auth?.jti);
        res.clearCookie(config.refreshCookieName);
        if (req.auth?.jti) req.audit?.log('token_revoked', { userId: req.auth.userId, orgId: req.auth.orgId, sessionId: req.auth.sessionId, jti: req.auth.jti, issuer: 'baalvion-auth' });
        req.audit?.log('logout', { userId: req.auth?.userId, orgId: req.auth?.orgId, sessionId: req.auth?.sessionId });
        sendSuccess(req, res, { message: 'Logged out successfully' });
    } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const parsed = schemas.forgotPassword.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        await authService.forgotPassword({ email: parsed.data.email, ipAddress: req.ip });
        req.audit?.log('password_reset_requested', { metadata: { email: parsed.data.email } });
        sendSuccess(req, res, { message: 'If that email exists, a reset link was sent' });
    } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const parsed = schemas.resetPassword.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        await authService.resetPassword({ ...parsed.data, ipAddress: req.ip });
        req.audit?.log('password_reset_completed', {});
        sendSuccess(req, res, { message: 'Password reset successful' });
    } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const token = req.query.token || req.body.token;
        if (!token) throw new AppError('VALIDATION_ERROR', 'Token is required', 400);
        await authService.verifyEmail({ token });
        sendSuccess(req, res, { message: 'Email verified successfully' });
    } catch (err) { next(err); }
};

// ── Phone verification (OTP) — authenticated; operates on req.auth.userId ─────────
exports.requestPhoneOtp = async (req, res, next) => {
    try {
        const parsed = schemas.phoneOtpRequest.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await phoneVerification.requestOtp({ userId: req.auth.userId, phone: parsed.data.phone, ipAddress: req.ip });
        req.audit?.log('phone_otp_requested', { userId: req.auth.userId, orgId: req.auth.orgId });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.verifyPhoneOtp = async (req, res, next) => {
    try {
        const parsed = schemas.phoneOtpVerify.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await phoneVerification.verifyOtp({ userId: req.auth.userId, code: parsed.data.code, ipAddress: req.ip });
        req.audit?.log('phone_verified', { userId: req.auth.userId, orgId: req.auth.orgId });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

// ── Passwordless email-OTP login — public (no session yet) ────────────────────────
exports.requestEmailOtp = async (req, res, next) => {
    try {
        const parsed = schemas.emailOtpRequest.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await emailLogin.requestOtp({ email: parsed.data.email, ipAddress: req.ip });
        req.audit?.log('email_otp_requested', { metadata: { email: parsed.data.email } });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.verifyEmailOtp = async (req, res, next) => {
    try {
        const parsed = schemas.emailOtpVerify.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await emailLogin.verifyOtp({ ...parsed.data, ...parseClientInfo(req) });
        // Same session shape as password login — set the refresh cookie, return the access token.
        res.cookie(config.refreshCookieName, result.refreshToken, { httpOnly: true, secure: config.env === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
        req.audit?.log('login_success', { userId: result.user?.id, orgId: result.user?.orgId, metadata: { email: parsed.data.email, method: 'email_otp', newUser: result.isNewUser } });
        sendSuccess(req, res, { accessToken: result.accessToken, user: result.user, expiresAt: result.expiresAt, isNewUser: result.isNewUser });
    } catch (err) {
        req.audit?.log('login_failure', { metadata: { email: req.body?.email, method: 'email_otp', reason: err.code || 'error' } });
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.auth.userId);
        sendSuccess(req, res, user);
    } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
    try {
        const parsed = schemas.updateMe.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const user = await authService.updateMe(req.auth.userId, parsed.data);
        sendSuccess(req, res, user);
    } catch (err) { next(err); }
};

exports.enableMfa = async (req, res, next) => {
    try {
        const result = await authService.enableMfa(req.auth.userId);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.verifyMfa = async (req, res, next) => {
    try {
        const parsed = schemas.mfaVerify.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.verifyMfa(req.auth.userId, parsed.data.code);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.disableMfa = async (req, res, next) => {
    try {
        await authService.disableMfa(req.auth.userId);
        sendSuccess(req, res, { message: 'MFA disabled' });
    } catch (err) { next(err); }
};

exports.verifyToken = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw new AppError('VALIDATION_ERROR', 'Token is required', 400);
        const result = await authService.verifyToken(token);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.listSessions = async (req, res, next) => {
    try {
        const sessions = await authService.listSessions(req.auth.userId);
        sendSuccess(req, res, sessions);
    } catch (err) { next(err); }
};

exports.revokeSession = async (req, res, next) => {
    try {
        await authService.revokeSession(req.auth.userId, req.params.sessionId);
        sendSuccess(req, res, { message: 'Session revoked' });
    } catch (err) { next(err); }
};

exports.revokeAllSessions = async (req, res, next) => {
    try {
        await authService.revokeAllSessions(req.auth.userId, req.auth.sessionId);
        sendSuccess(req, res, { message: 'All other sessions revoked' });
    } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const { page, limit, userId, action } = req.query;
        const result = await authService.getAuditLogs(req.auth.orgId, {
            page:   page   ? parseInt(page, 10)   : 1,
            limit:  limit  ? parseInt(limit, 10)  : 50,
            userId: userId || undefined,
            action: action || undefined,
        });
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.validateInvite = async (req, res, next) => {
    try {
        const token = req.query.token || req.query.inviteToken;
        const result = await authService.validateInvite(token);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};

exports.acceptInvite = async (req, res, next) => {
    try {
        const parsed = schemas.acceptInvite.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten());
        const result = await authService.acceptInvite({ ...parsed.data, ...parseClientInfo(req) });
        // Second-factor continuation — the invite is accepted (membership joined) but no
        // session/cookie is issued until MFA clears. Relays the challenge exactly like login().
        if (result.mfa_required) {
            return sendSuccess(req, res, { mfa_required: true, challengeToken: result.challengeToken });
        }
        if (result.mfa_enrollment_required) {
            return sendSuccess(req, res, { mfa_enrollment_required: true, challengeToken: result.challengeToken });
        }
        res.cookie(config.refreshCookieName, result.refreshToken, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        sendSuccess(req, res, { accessToken: result.accessToken, user: result.user, expiresAt: result.expiresAt }, 201);
    } catch (err) { next(err); }
};
