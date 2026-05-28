'use strict';
const { v4: uuidv4 } = require('uuid');
const mfaService    = require('./mfaService');

const { userRepo, orgRepo, sessionRepo, rtRepo, inviteRepo, auditRepo } = require('../repositories');
const password   = require('../utils/password');
const jwt        = require('../utils/jwtRsa');
const redis      = require('../config/redis');
const eventBus   = require('../utils/eventBus');
const { generateToken, hashToken } = require('../utils/crypto');
const { sendMail }  = require('../utils/mailer');
const { AppError }  = require('../utils/errors');
const config        = require('../config/appConfig');

// ── Rate-limit thresholds ──────────────────────────────────────────────────────
const MAX_IP_ATTEMPTS    = config.security.ipRateLimit    || 20;
const MAX_EMAIL_ATTEMPTS = config.security.emailRateLimit || 10;

// ── Presentation helpers ───────────────────────────────────────────────────────

function presentUser(user, extras = {}) {
    return {
        id:            String(user.id),
        email:         user.email,
        fullName:      user.full_name  || null,
        avatarUrl:     user.avatar_url || null,
        status:        user.status,
        emailVerified: !!user.email_verified_at,
        mfaEnabled:    user.mfa_enabled,
        ...extras,
    };
}

/**
 * Builds the standard JWT payload shared by access and refresh tokens.
 * Fetches the caller's active org membership to embed role + permissions.
 */
async function resolveTokenPayload(user, orgId) {
    let role = 'member', permissions = [], serviceRoles = {};

    if (orgId) {
        const m = await orgRepo.getActiveMember(orgId, user.id);
        if (m) {
            role         = m.role;
            serviceRoles = m.service_roles || {};
            permissions  = Object.keys(serviceRoles);
        }
    }

    return { userId: user.id, email: user.email, orgId, role, permissions, serviceRoles };
}

// ── Token issuance ─────────────────────────────────────────────────────────────

async function issueTokenPair(user, orgId, sessionId, familyId) {
    const { userId, email, role, permissions } = await resolveTokenPayload(user, orgId);

    const accessToken  = jwt.signAccessToken({
        sub:         userId,
        email,
        orgId,
        role,
        permissions,
        sid:         sessionId,
    });

    const rawRefresh   = jwt.signRefreshToken({
        sub:      userId,
        sid:      sessionId,
        familyId: familyId,
    });

    const refreshHash  = jwt.hashToken(rawRefresh);

    await rtRepo.create({
        userId,
        sessionId,
        familyId,
        tokenHash: refreshHash,
    });

    return {
        accessToken,
        refreshToken:  rawRefresh,
        expiresAt:     new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        role,
    };
}

// ── Auth flows ─────────────────────────────────────────────────────────────────

async function register({ email, password: plainPw, fullName, orgName, ipAddress, userAgent }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409);

    const passwordHash = await password.hash(plainPw);
    const user = await userRepo.create({ email, passwordHash, fullName });

    const org = await orgRepo.create({ name: orgName || `${(fullName || email).split('@')[0]}'s Workspace`, ownerId: user.id });
    await orgRepo.addMember({ orgId: org.id, userId: user.id, role: 'owner' });

    // Email verification (fire-and-forget)
    const verifyToken = generateToken();
    const db = require('../models');
    await db.EmailVerification.create({
        user_id:    user.id,
        token_hash: hashToken(verifyToken),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const frontendUrl = config.frontendUrl || 'http://localhost:8080';
    sendMail({
        to:      email,
        subject: 'Verify your Baalvion account',
        html:    `<p>Welcome! <a href="${frontendUrl}/verify-email?token=${verifyToken}">Verify your email</a>. Expires in 24 hours.</p>`,
    }).catch(() => {});

    const session = await sessionRepo.create({ userId: user.id, orgId: org.id, ipAddress, userAgent });
    const tokens  = await issueTokenPair(user, org.id, session.id, uuidv4());

    await auditRepo.append({ userId: user.id, orgId: org.id, action: 'user.register', ipAddress });

    // Publish events (fire-and-forget — never blocks the response)
    eventBus.publish('auth.registered', {
        userId:    String(user.id),
        email:     user.email,
        fullName:  user.full_name || null,
        orgId:     org.id,
        orgName:   org.name,
        ipAddress,
    }).catch(() => {});

    eventBus.publish('auth.email_verification_requested', {
        userId:     String(user.id),
        email:      user.email,
        verifyUrl:  `${frontendUrl}/verify-email?token=${verifyToken}`,
        expiresAt:  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).catch(() => {});

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(user, { orgId: org.id, role: 'owner' }),
        org:          { id: org.id, name: org.name, slug: org.slug },
    };
}

async function login({ email, password: plainPw, ipAddress, userAgent }) {
    // 1 — Brute-force check BEFORE touching the DB (fail-fast, no user enumeration)
    const { ipCount, emailCount } = await redis.getLoginAttempts(ipAddress, email);
    if (ipCount    >= MAX_IP_ATTEMPTS)    throw new AppError('RATE_LIMITED', 'Too many login attempts. Try again later.', 429);
    if (emailCount >= MAX_EMAIL_ATTEMPTS) throw new AppError('RATE_LIMITED', 'Too many attempts for this account. Try again later.', 429);

    // 2 — Credential verification (intentionally same error for wrong email or wrong password)
    const user = await userRepo.findByEmail(email);
    const credentialsValid = user && await password.verify(user.password_hash, plainPw);

    if (!credentialsValid) {
        await redis.incrLoginAttempts(ipAddress, email);
        await auditRepo.append({ userId: user?.id, action: 'user.login_failed', ipAddress, metadata: { email } });
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
        throw new AppError('ACCOUNT_DISABLED', 'Account is suspended or inactive', 403);
    }

    // 3 — Successful password check — reset counters, derive org
    await redis.resetLoginAttempts(ipAddress, email);

    const membership = await orgRepo.getPrimaryMembership(user.id);
    const orgId      = membership?.org_id || null;

    // 4 — MFA gate: if enabled, issue a short-lived challenge instead of full tokens
    if (user.mfa_enabled) {
        const challengeToken = await mfaService.createChallenge({ userId: user.id, orgId, ipAddress, userAgent });
        await auditRepo.append({ userId: user.id, orgId, action: 'user.login_mfa_required', ipAddress });
        return { mfa_required: true, challengeToken };
    }

    // 5 — No MFA — create session + issue tokens
    const session = await sessionRepo.create({ userId: user.id, orgId, ipAddress, userAgent });
    const tokens  = await issueTokenPair(user, orgId, session.id, uuidv4());

    await auditRepo.append({ userId: user.id, orgId, action: 'user.login', ipAddress });

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(user, { orgId, role: tokens.role }),
    };
}

/**
 * Completes a two-step MFA login.
 * Called with { challengeToken, code } after /login returned mfa_required.
 */
async function completeMfaLogin({ challengeToken, code, ipAddress, userAgent }) {
    // Peek without consuming — need the userId to load the user's mfa_secret
    const challengeData = await mfaService.peekChallenge(challengeToken);
    if (!challengeData) throw new AppError('MFA_CHALLENGE_EXPIRED', 'MFA challenge expired or invalid. Please log in again.', 401);

    const user = await userRepo.findById(challengeData.userId);
    if (!user || user.status !== 'active') throw new AppError('UNAUTHORIZED', 'Account not found or inactive', 401);

    // verifyChallenge enforces attempt limits and deletes the challenge on success (single-use)
    const challenge = await mfaService.verifyChallenge(challengeToken, code, user);

    const session = await sessionRepo.create({
        userId:    challenge.userId,
        orgId:     challenge.orgId,
        ipAddress: challenge.ipAddress,
        userAgent: challenge.userAgent,
    });
    const tokens = await issueTokenPair(user, challenge.orgId, session.id, uuidv4());

    await auditRepo.append({ userId: user.id, orgId: challenge.orgId, action: 'user.login', ipAddress, metadata: { mfa: true } });

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(user, { orgId: challenge.orgId, role: tokens.role }),
    };
}

async function refresh(rawToken, ipAddress) {
    if (!rawToken) throw new AppError('UNAUTHORIZED', 'Refresh token required', 401);

    // 1 — Verify RS256 signature and expiry
    let decoded;
    try { decoded = jwt.verifyRefreshToken(rawToken); }
    catch { throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401); }

    const familyId = decoded.family_id;

    // 2 — Fast-path: if Redis marks this family revoked, bail before hitting DB
    if (familyId && await redis.isFamilyRevoked(familyId)) {
        throw new AppError('REFRESH_TOKEN_REUSE', 'Session invalidated. Please log in again.', 401);
    }

    const tokenHash = jwt.hashToken(rawToken);
    const storedRT  = await rtRepo.findByHash(tokenHash);

    if (!storedRT) {
        throw new AppError('UNAUTHORIZED', 'Refresh token not found', 401);
    }

    // 3 — Reuse detection: token exists but was already rotated/revoked
    if (storedRT.revoked_at) {
        if (familyId) {
            // Compromise the entire family — both the legitimate holder and the
            // attacker are kicked out, forcing a fresh login.
            await rtRepo.revokeFamily(familyId);
            await redis.markFamilyRevoked(familyId);
            await sessionRepo.revoke(storedRT.session_id);
            await auditRepo.append({
                userId:    decoded.sub,
                action:    'security.refresh_reuse_detected',
                ipAddress,
                metadata:  { familyId, tokenJti: decoded.jti },
            });
        }
        throw new AppError('REFRESH_TOKEN_REUSE', 'Refresh token already used. Session revoked for security.', 401);
    }

    if (new Date() > storedRT.expires_at) {
        throw new AppError('UNAUTHORIZED', 'Refresh token expired', 401);
    }

    // 4 — Happy path: revoke old token, issue new pair (same session + family)
    await rtRepo.revoke(storedRT.id);

    const session = await sessionRepo.findActiveById(storedRT.session_id);
    if (!session) throw new AppError('UNAUTHORIZED', 'Session revoked', 401);
    await sessionRepo.touch(session.id);

    const user = await userRepo.findById(decoded.sub);
    if (!user || user.status !== 'active') throw new AppError('UNAUTHORIZED', 'Account not found or inactive', 401);

    const tokens = await issueTokenPair(user, session.org_id, session.id, familyId);

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
    };
}

async function logout(sessionId, rawToken, accessJti) {
    // Revoke session + all its refresh tokens
    if (sessionId) {
        await sessionRepo.revoke(sessionId);
        await rtRepo.revokeBySessionId(sessionId);
    }
    // Revoke specific refresh token if provided outside a session context
    if (rawToken && !sessionId) {
        const hash = jwt.hashToken(rawToken);
        const stored = await rtRepo.findByHash(hash);
        if (stored) {
            await rtRepo.revoke(stored.id);
            await rtRepo.revokeFamily(stored.family_id);
        }
    }
    // Blacklist access token in Redis so it's rejected before natural expiry
    if (accessJti) {
        await redis.blacklistToken(accessJti);
    }
}

async function forgotPassword({ email, ipAddress }) {
    const user = await userRepo.findByEmail(email);
    if (!user) return; // silent — do not leak whether email exists

    const token      = generateToken();
    const token_hash = hashToken(token);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    const db = require('../models');
    await db.PasswordReset.update({ used_at: new Date() }, { where: { user_id: user.id, used_at: null } });
    await db.PasswordReset.create({ user_id: user.id, token_hash, expires_at });

    const frontendUrl = config.frontendUrl || 'http://localhost:8080';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Publish event for notification-service to send the email via its template engine
    eventBus.publish('auth.password_reset_requested', {
        userId:    String(user.id),
        email:     user.email,
        fullName:  user.full_name || null,
        resetUrl,
        expiresAt: expires_at.toISOString(),
        ipAddress,
    }).catch(() => {});

    // Direct SMTP fallback (runs if notification-service is unavailable)
    sendMail({
        to:      email,
        subject: 'Reset your Baalvion password',
        html:    `<p><a href="${resetUrl}">Reset your password</a>. Expires in 1 hour.</p>`,
    }).catch(() => {});

    await auditRepo.append({ userId: user.id, action: 'user.forgot_password', ipAddress });
}

async function resetPassword({ token, newPassword: plainPw, ipAddress }) {
    const db = require('../models');
    const token_hash = hashToken(token);
    const record     = await db.PasswordReset.findOne({ where: { token_hash, used_at: null } });
    if (!record || new Date() > record.expires_at) {
        throw new AppError('INVALID_TOKEN', 'Reset token is invalid or expired', 400);
    }

    const passwordHash = await password.hash(plainPw);
    await userRepo.setPasswordHash(record.user_id, passwordHash);
    await record.update({ used_at: new Date() });

    // Security: invalidate all sessions on password reset
    await sessionRepo.revokeAllForUser(record.user_id);
    await rtRepo.revokeAllForUser(record.user_id);

    await auditRepo.append({ userId: record.user_id, action: 'user.password_reset', ipAddress });
}

async function verifyEmail({ token }) {
    const db = require('../models');
    const token_hash = hashToken(token);
    const record     = await db.EmailVerification.findOne({ where: { token_hash, verified_at: null } });
    if (!record || new Date() > record.expires_at) {
        throw new AppError('INVALID_TOKEN', 'Verification token is invalid or expired', 400);
    }
    await userRepo.setEmailVerified(record.user_id);
    await record.update({ verified_at: new Date() });
}

async function getMe(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    return presentUser(user);
}

async function updateMe(userId, { fullName, avatarUrl }) {
    const user = await userRepo.updateProfile(userId, { fullName, avatarUrl });
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);
    return presentUser(user);
}

// ── MFA ────────────────────────────────────────────────────────────────────────

async function enableMfa(userId) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

    const result = await mfaService.initiateSetup(user);
    await userRepo.updateMfa(userId, { pendingSecret: result.secret });

    return result; // { qrCodeUrl, secret, recoveryCodes }
}

async function verifyMfa(userId, code) {
    const user = await userRepo.findById(userId);
    if (!user?.mfa_pending_secret) throw new AppError('MFA_NOT_INITIALIZED', 'MFA setup not started', 400);

    mfaService.confirmSetup(user.mfa_pending_secret, code); // throws INVALID_MFA_CODE if wrong

    await userRepo.updateMfa(userId, { secret: user.mfa_pending_secret, enabled: true, pendingSecret: null });

    eventBus.publish('auth.mfa_enabled', {
        userId: String(userId),
        email:  user.email,
    }).catch(() => {});

    return { message: 'MFA enabled successfully' };
}

async function disableMfa(userId) {
    await userRepo.updateMfa(userId, { secret: null, pendingSecret: null, enabled: false, recoveryCodes: [] });
}

// ── Session management ─────────────────────────────────────────────────────────

async function listSessions(userId) {
    const sessions = await sessionRepo.listActive(userId);
    return sessions.map((s) => ({
        id:          s.id,
        ipAddress:   s.ip_address,
        userAgent:   s.user_agent,
        createdAt:   s.created_at,
        lastSeenAt:  s.last_seen_at,
        expiresAt:   s.expires_at,
    }));
}

async function revokeSession(userId, sessionId) {
    const session = await sessionRepo.findActiveById(sessionId);
    if (!session || String(session.user_id) !== String(userId)) {
        throw new AppError('NOT_FOUND', 'Session not found', 404);
    }
    await sessionRepo.revoke(sessionId);
    await rtRepo.revokeBySessionId(sessionId);
}

async function revokeAllSessions(userId, currentSessionId) {
    const sessions = await sessionRepo.listActive(userId);
    await Promise.all(
        sessions
            .filter((s) => s.id !== currentSessionId)
            .map(async (s) => {
                await sessionRepo.revoke(s.id);
                await rtRepo.revokeBySessionId(s.id);
            })
    );
}

// ── Audit log query ────────────────────────────────────────────────────────────

async function getAuditLogs(orgId, { page = 1, limit = 50, userId, action } = {}) {
    return auditRepo.findPaginated({ orgId, userId, action, page, limit });
}

// ── Invite flows ───────────────────────────────────────────────────────────────

async function validateInvite(token) {
    if (!token) throw new AppError('MISSING_TOKEN', 'Token is required', 400);
    const tokenHash  = hashToken(token);
    const invitation = await inviteRepo.findPendingByHash(tokenHash);
    if (!invitation) throw new AppError('INVALID_TOKEN', 'Invitation is invalid or already used', 400);
    if (new Date() > invitation.expires_at) throw new AppError('TOKEN_EXPIRED', 'Invitation has expired', 400);
    const org = await orgRepo.findById(invitation.org_id);
    return {
        email:     invitation.email,
        role:      invitation.role,
        orgName:   org?.name || 'Unknown Organization',
        expiresAt: invitation.expires_at.toISOString(),
    };
}

async function acceptInvite({ token, email, password: plainPw, fullName, ipAddress, userAgent }) {
    if (!token) throw new AppError('MISSING_TOKEN', 'Token is required', 400);

    const tokenHash  = hashToken(token);
    const invitation = await inviteRepo.findPendingByHash(tokenHash);
    if (!invitation) throw new AppError('INVALID_TOKEN', 'Invitation is invalid or already used', 400);
    if (new Date() > invitation.expires_at) throw new AppError('TOKEN_EXPIRED', 'Invitation has expired', 400);
    if (invitation.email.toLowerCase() !== email.toLowerCase())
        throw new AppError('EMAIL_MISMATCH', 'Email does not match this invitation', 400);

    let user = await userRepo.findByEmail(invitation.email);
    if (!user) {
        const passwordHash = await password.hash(plainPw);
        user = await userRepo.create({ email: invitation.email, passwordHash, fullName });
        // Mark email verified — possession of the invite link proves email ownership
        await userRepo.setEmailVerified(user.id);
    }

    await orgRepo.addMember({ orgId: invitation.org_id, userId: user.id, role: invitation.role, invitedBy: invitation.created_by });
    await inviteRepo.markAccepted(invitation.id);
    await auditRepo.append({ userId: user.id, orgId: invitation.org_id, action: 'member.invite_accepted', ipAddress });

    const session = await sessionRepo.create({ userId: user.id, orgId: invitation.org_id, ipAddress, userAgent });
    const tokens  = await issueTokenPair(user, invitation.org_id, session.id, uuidv4());

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(user, { orgId: invitation.org_id, role: invitation.role }),
    };
}

// ── Service-to-service token verification ─────────────────────────────────────

async function verifyToken(token) {
    try {
        const decoded = jwt.verifyAccessToken(token);
        // Check Redis blacklist (populated on logout)
        if (decoded.jti && await redis.isTokenBlacklisted(decoded.jti)) {
            return { valid: false, reason: 'blacklisted' };
        }
        return { valid: true, payload: decoded };
    } catch (err) {
        return { valid: false, reason: err.message };
    }
}

module.exports = {
    register,
    login,
    completeMfaLogin,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    getMe,
    updateMe,
    enableMfa,
    verifyMfa,
    disableMfa,
    listSessions,
    revokeSession,
    revokeAllSessions,
    getAuditLogs,
    validateInvite,
    acceptInvite,
    verifyToken,
};
