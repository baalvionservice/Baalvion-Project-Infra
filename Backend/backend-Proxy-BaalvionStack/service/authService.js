const { users } = require('../models');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const config = require('../config/appConfig');
const jwtServer = require('../utils/jwtserver');
const { AppError } = require('../utils/errors');
const { expandPermissions } = require('./rbac');
const eventBus = require('./eventBus');
const store = require('./platformStore');
const sessionStore = require('./sessionStore');
const auditService = require('./auditService');
const { generateToken } = require('../utils/crypto');

const sanitizeUser = (user) => ({
    id: user.id,
    orgId: user.orgId,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    mfaEnabled: user.mfaEnabled,
    emailVerified: user.emailVerified,
});

const buildTokenPayload = async (user, sessionId, tokenVersion = 0) => ({
    userId: user.id,
    email: user.email,
    organizationId: user.orgId,
    role: user.role,
    permissions: expandPermissions(user.role),
    sessionId,
    tokenVersion,
});

// token_version is not part of the platformStore projection; read it directly.
const getTokenVersion = async (userId) => {
    try {
        const row = await users.findByPk(userId, { attributes: ['token_version'] });
        return row ? Number(row.token_version || 0) : 0;
    } catch (_) {
        return 0;
    }
};

const login = async ({ email, password, ipAddress, userAgent }) => {
    await store.ensureSeed();
    const user = await store.findUserByEmail(email);

    if (!user) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
        throw new AppError('ACCOUNT_DISABLED', 'User account is not active', 403);
    }

    const tokenVersion = await getTokenVersion(user.id);

    // Opaque, server-side, rotating refresh token persisted in the sessions table.
    const session = await sessionStore.createSession({
        userId: user.id,
        orgId: user.orgId,
        tokenVersion,
        ipAddress,
        userAgent,
    });

    const tokenPayload = await buildTokenPayload(user, session.sessionId, tokenVersion);
    const token = jwtServer.generateAccessToken(tokenPayload);

    await auditService.logAuth('auth.login', {
        orgId: user.orgId,
        userId: user.id,
        details: { ipAddress, userAgent, success: true },
    });

    return {
        token,
        refreshToken: session.refreshToken,
        user: sanitizeUser(user),
        expiresAt: new Date(Date.now() + (15 * 60 * 1000)).toISOString(),
    };
};

const refresh = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError('UNAUTHORIZED', 'Refresh token is required', 401);
    }

    // Validates + rotates the opaque refresh token atomically against the session row.
    const rotated = await sessionStore.rotateRefresh(refreshToken);
    if (!rotated) {
        throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }

    const user = await store.getById('users', rotated.userId, rotated.orgId);
    if (!user) {
        await sessionStore.revokeSession(rotated.sessionId);
        throw new AppError('SESSION_NOT_FOUND', 'Refresh token is invalid', 401);
    }

    const tokenVersion = await getTokenVersion(user.id);
    const token = jwtServer.generateAccessToken(
        await buildTokenPayload(user, rotated.sessionId, tokenVersion),
    );

    return {
        token,
        refreshToken: rotated.refreshToken,
        expiresAt: new Date(Date.now() + (15 * 60 * 1000)).toISOString(),
    };
};

const forgotPassword = async ({ email }) => {
    const user = await store.findUserByEmail(email);
    if (user) {
        await store.createNotification({
            orgId: user.orgId,
            title: 'Password reset requested',
            body: `A password reset was requested for ${email}.`,
            read: false,
            createdAt: new Date().toISOString(),
        });
    }
};

const resetPassword = async ({ email, newPassword }) => {
    const user = await store.findUserByEmail(email);
    if (!user) {
        return;
    }

    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    await store.update('users', user.id, { passwordHash }, user.orgId);
    // Force re-authentication everywhere after a password change.
    await logoutAll(user.id, user.orgId);
};

const verifyEmail = async ({ email }) => {
    const user = await store.findUserByEmail(email);
    if (user) {
        await store.update('users', user.id, { emailVerified: true }, user.orgId);
    }
};

const enableMfa = async (auth) => {
    const user = await store.getById('users', auth.userId, auth.orgId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const secret = speakeasy.generateSecret({ name: `Baalvion (${user.email})` });
    const recoveryCodes = Array.from({ length: 8 }, () => generateToken(4));
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    await store.update('users', user.id, {
        mfaPendingSecret: secret.base32,
        recoveryCodes,
    }, user.orgId);

    return {
        qrCodeUrl,
        secret: secret.base32,
        recoveryCodes,
    };
};

const verifyMfa = async (auth, code) => {
    const user = await store.getById('users', auth.userId, auth.orgId);
    if (!user || !user.mfaPendingSecret) {
        throw new AppError('MFA_NOT_INITIALIZED', 'MFA setup not started', 400);
    }

    const valid = speakeasy.totp.verify({ secret: user.mfaPendingSecret, encoding: 'base32', token: code, window: 1 });
    if (!valid) {
        throw new AppError('INVALID_MFA_CODE', 'Invalid MFA code', 400);
    }

    await store.update('users', user.id, {
        mfaEnabled: true,
        mfaSecret: user.mfaPendingSecret,
        mfaPendingSecret: null,
    }, user.orgId);

    const token = jwtServer.generateAccessToken(
        await buildTokenPayload(user, auth.sessionId, await getTokenVersion(user.id)),
    );
    return { token };
};

const disableMfa = async (auth) => {
    await store.update('users', auth.userId, {
        mfaEnabled: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        recoveryCodes: [],
    }, auth.orgId);
};

const logout = async ({ refreshToken, sessionId, userId, orgId } = {}) => {
    if (sessionId) {
        await sessionStore.revokeSession(sessionId);
    } else if (refreshToken) {
        await sessionStore.revokeSessionByRefresh(refreshToken);
    }
    if (userId) {
        await auditService.logAuth('auth.logout', { orgId, userId, details: { sessionId: sessionId || null } });
    }
};

// Invalidate every device/session for a user (password change, security event).
const logoutAll = async (userId, orgId) => {
    const tokenVersion = await sessionStore.revokeAllForUser(userId);
    await auditService.logAuth('auth.logout_all', { orgId, userId, details: { tokenVersion } });
    return tokenVersion;
};

const issueEvent = (type, orgId, payload) => {
    eventBus.publish({ type, orgId, payload, timestamp: new Date().toISOString() });
};

module.exports = {
    login,
    logout,
    logoutAll,
    refresh,
    forgotPassword,
    resetPassword,
    verifyEmail,
    enableMfa,
    verifyMfa,
    disableMfa,
    issueEvent,
    sanitizeUser,
};