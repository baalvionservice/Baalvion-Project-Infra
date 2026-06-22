'use strict';
const { v4: uuidv4 } = require('uuid');
const mfaService    = require('./mfaService');
const sessionEnrichment = require('./sessionEnrichmentService');

const { userRepo, orgRepo, sessionRepo, rtRepo, inviteRepo, auditRepo } = require('../repositories');
const password   = require('../utils/password');
const jwt        = require('../utils/jwtRsa');
const redis      = require('../config/redis');
const eventBus   = require('../utils/eventBus');
const { generateToken, hashToken } = require('../utils/crypto');
const { sendMail }  = require('../utils/mailer');
const { AppError }  = require('../utils/errors');
const config        = require('../config/appConfig');
// C4: platform vs tenant role separation. assertNoRoleConfusion guarantees an org-membership
// role is never a platform role; isPlatformRole validates an explicit platform grant.
const { assertNoRoleConfusion, isPlatformRole } = require('@baalvion/auth-node');

// ── Rate-limit thresholds ──────────────────────────────────────────────────────
const MAX_IP_ATTEMPTS    = config.security.ipRateLimit    || 20;
const MAX_EMAIL_ATTEMPTS = config.security.emailRateLimit || 10;

// ── Session enrichment (Phase 2) ────────────────────────────────────────────────
// Annotate a freshly-created session with geo/device/risk. analyseLoginEvent is itself
// fail-soft (returns null, never throws); this wrapper adds a second guard so a surprise
// error can never affect the auth result. Awaited so the row is enriched before we respond,
// but any failure is swallowed — enrichment must NEVER block or fail a login.
async function enrichSessionSafe(sessionId, userId, ipAddress, userAgent) {
    try {
        await sessionEnrichment.analyseLoginEvent({ sessionId, userId, ipAddress, userAgent });
    } catch (_) { /* never affect the auth result */ }
}

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
        mfaRequired:   !!user.mfa_required,
        lastLoginAt:   user.last_login_at || null,
        ...extras,
    };
}

/**
 * Builds the standard JWT payload shared by access and refresh tokens.
 * Fetches the caller's active org membership to embed role + permissions.
 */
// Role → permission grants embedded in the access token. Hierarchical roles still
// drive most checks, but populating permissions[] makes fine-grained
// requirePermission() gates meaningful (the claim used to ship empty).
const ROLE_PERMISSIONS = {
    super_admin: ['users:read', 'users:write', 'users:delete', 'orgs:read', 'orgs:write', 'billing:manage',
                  'staff:read', 'staff:write', 'staff:manage', 'cms:read', 'cms:write', 'cms:manage',
                  'content:read', 'content:write', 'content:publish', 'media:read', 'media:write',
                  'settings:manage', 'analytics:read', 'audit:read'],
    owner:       ['users:read', 'users:write', 'orgs:read', 'orgs:write', 'billing:manage',
                  'staff:read', 'staff:write', 'staff:manage', 'cms:read', 'cms:write', 'cms:manage',
                  'content:read', 'content:write', 'content:publish', 'media:read', 'media:write',
                  'settings:manage', 'analytics:read'],
    admin:       ['users:read', 'users:write', 'staff:read', 'cms:read', 'cms:write', 'cms:manage',
                  'content:read', 'content:write', 'content:publish', 'media:read', 'media:write', 'analytics:read'],
    // ── 7-tier trade-network capability model (see utils/orgConstants.js) ──────────
    manager:     ['users:read', 'content:read', 'content:write', 'content:publish',
                  'media:read', 'media:write', 'analytics:read', 'orders:approve'],
    officer:     ['content:read', 'content:write', 'content:publish', 'media:read', 'analytics:read', 'orders:approve'],
    operator:    ['content:read', 'content:write', 'media:read', 'media:write'],
    analyst:     ['content:read', 'media:read', 'analytics:read'],
    // ── Legacy roles (kept for backward compatibility with pre-existing seed rows) ─
    editor:      ['cms:read', 'content:read', 'content:write', 'content:publish', 'media:read', 'media:write'],
    member:      ['cms:read', 'content:read', 'media:read'],
    viewer:      ['cms:read', 'content:read'],
};

async function resolveTokenPayload(user, orgId) {
    let role = 'member', serviceRoles = {}, orgType = null;

    if (orgId) {
        const m = await orgRepo.getActiveMember(orgId, user.id);
        if (m) {
            role         = m.role;
            serviceRoles = m.service_roles || {};
        }
        // Embed the org's TYPE so downstream consumers can resolve dashboard access from
        // (orgType, role) instead of superadmin persona impersonation.
        const org = await orgRepo.findById(orgId);
        if (org) orgType = org.type || null;
    }

    // C4 role-confusion guard: an organization-membership role must never be a platform role.
    // (Tenant principals carrying platform roles is what would re-open cross-tenant bypass.)
    assertNoRoleConfusion(role);

    // Platform grant is a SEPARATE dimension stored on the user (auth.users.platform_role), not an
    // org membership. When present and valid, it is added to roles[] so platform operators retain
    // their (now explicit) cross-tenant bypass; tenant principals never have it → fail-closed.
    const platformRole = isPlatformRole(user.platform_role) ? user.platform_role : null;
    const roles = platformRole ? [platformRole, role] : [role];

    // Permissions = role grants ∪ any explicit per-service grants on the membership.
    const permissions = Array.from(new Set([
        ...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.member),
        ...Object.keys(serviceRoles),
    ]));

    return { userId: user.id, email: user.email, orgId, orgType, role, roles, permissions, serviceRoles };
}

// ── Token issuance ─────────────────────────────────────────────────────────────

async function issueTokenPair(user, orgId, sessionId, familyId) {
    const { userId, email, role, roles, permissions, orgType } = await resolveTokenPayload(user, orgId);

    const accessToken  = jwt.signAccessToken({
        sub:         userId,
        email,
        orgId,
        orgType,
        role,
        roles,
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
        orgType,
    };
}

// ── Auth flows ─────────────────────────────────────────────────────────────────

async function register({ email, password: plainPw, fullName, orgName, orgType, ipAddress, userAgent }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError('EMAIL_TAKEN', 'Email already registered', 409);

    const passwordHash = await password.hash(plainPw);
    const user = await userRepo.create({ email, passwordHash, fullName });

    // New self-service registrations default to a Buyer organization unless an explicit
    // (validated) org type is supplied — buyers are the lowest-privilege market participant.
    const ALLOWED_ORG_TYPES = new Set([
        'buyer', 'seller', 'trade_agent', 'logistics_provider', 'customs_authority',
        'bank', 'insurance_provider', 'compliance_agency', 'regulator', 'platform_owner',
    ]);
    const safeOrgType = ALLOWED_ORG_TYPES.has(orgType) ? orgType : 'buyer';
    const org = await orgRepo.create({ name: orgName || `${(fullName || email).split('@')[0]}'s Workspace`, ownerId: user.id, type: safeOrgType });
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
    await enrichSessionSafe(session.id, user.id, ipAddress, userAgent);

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
        user:         presentUser(user, { orgId: org.id, orgType: org.type, role: 'owner' }),
        org:          { id: org.id, name: org.name, slug: org.slug, type: org.type },
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

    // 3b — Org lifecycle gate: a suspended organization cannot be operated by its members.
    if (membership?.organization && membership.organization.status === 'suspended') {
        await auditRepo.append({ userId: user.id, orgId, action: 'user.login_org_suspended', ipAddress });
        throw new AppError('ORG_SUSPENDED', 'Your organization is suspended. Contact the platform administrator.', 403);
    }

    // 4 — MFA gate: if enabled, issue a short-lived challenge instead of full tokens
    if (user.mfa_enabled) {
        const challengeToken = await mfaService.createChallenge({ userId: user.id, orgId, ipAddress, userAgent });
        await auditRepo.append({ userId: user.id, orgId, action: 'user.login_mfa_required', ipAddress });
        return { mfa_required: true, challengeToken };
    }

    // 4b — Force-MFA gate: an admin/platform set mfa_required but the user has not enrolled
    // yet. Do NOT issue a session — issue an ENROLLMENT challenge instead. A normal session is
    // granted only after the user sets up + verifies an authenticator via /mfa/enroll.
    if (user.mfa_required && !user.mfa_enabled) {
        const challengeToken = await mfaService.createChallenge({ userId: user.id, orgId, ipAddress, userAgent });
        await auditRepo.append({ userId: user.id, orgId, action: 'user.mfa_enrollment_required', ipAddress });
        return { mfa_enrollment_required: true, challengeToken };
    }

    // 5 — No MFA — create session + issue tokens
    const session = await sessionRepo.create({ userId: user.id, orgId, ipAddress, userAgent });
    const tokens  = await issueTokenPair(user, orgId, session.id, uuidv4());
    await enrichSessionSafe(session.id, user.id, ipAddress, userAgent);

    await userRepo.setLastLogin(user.id).catch(() => {});
    await auditRepo.append({ userId: user.id, orgId, action: 'user.login', ipAddress });

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(user, { orgId, orgType: tokens.orgType, role: tokens.role }),
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
    await enrichSessionSafe(session.id, challenge.userId, challenge.ipAddress, challenge.userAgent);

    await userRepo.setLastLogin(user.id).catch(() => {});
    await auditRepo.append({ userId: user.id, orgId: challenge.orgId, action: 'user.login', ipAddress, metadata: { mfa: true } });

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(user, { orgId: challenge.orgId, orgType: tokens.orgType, role: tokens.role }),
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

    // Org suspension: a suspended organization cannot refresh. Kill the whole family + session.
    if (session.org_id) {
        const org = await orgRepo.findById(session.org_id);
        if (org && org.status === 'suspended') {
            await rtRepo.revokeFamily(familyId);
            await redis.markFamilyRevoked(familyId);
            await sessionRepo.revoke(session.id);
            await auditRepo.append({ userId: user.id, orgId: session.org_id, action: 'security.refresh_denied_org_suspended', ipAddress });
            throw new AppError('ORG_SUSPENDED', 'Organization is suspended. Contact the platform administrator.', 403);
        }
    }

    // Force-MFA: a user under an mfa_required mandate who has not yet enrolled cannot keep a
    // live session — deny the refresh and tear the session down so they must re-login + enrol.
    if (user.mfa_required && !user.mfa_enabled) {
        await rtRepo.revokeFamily(familyId);
        await redis.markFamilyRevoked(familyId);
        await sessionRepo.revoke(session.id);
        await auditRepo.append({ userId: user.id, orgId: session.org_id, action: 'security.refresh_denied_mfa_required', ipAddress });
        throw new AppError('MFA_ENROLLMENT_REQUIRED', 'Multi-factor enrollment required. Please log in again.', 403);
    }

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

// ── Force-MFA enrollment (no session — driven by the login enrollment challenge) ──

/**
 * Step 1 of force-MFA enrollment. Keyed by the enrollment challengeToken returned from
 * /login (mfa_enrollment_required). Generates + stores a pending TOTP secret and returns
 * the QR/secret/recovery codes. Does NOT consume the challenge (step 2 does).
 */
async function enrollMfaStart(challengeToken) {
    const data = await mfaService.peekChallenge(challengeToken);
    if (!data) throw new AppError('MFA_CHALLENGE_EXPIRED', 'Enrollment challenge expired or invalid. Please log in again.', 401);

    const user = await userRepo.findById(data.userId);
    if (!user || user.status !== 'active') throw new AppError('UNAUTHORIZED', 'Account not found or inactive', 401);

    const setup = await mfaService.initiateSetup(user);
    await userRepo.updateMfa(user.id, { pendingSecret: setup.secret });
    await auditRepo.append({ userId: user.id, orgId: data.orgId, action: 'user.mfa_enrollment_started' });
    return setup; // { qrCodeUrl, secret, recoveryCodes }
}

/**
 * Step 2 of force-MFA enrollment. Confirms the TOTP code against the pending secret,
 * activates MFA, consumes the challenge, and ONLY THEN issues a full token pair. This is
 * the single place a normal session is granted to a force-MFA user.
 */
async function enrollMfaComplete({ challengeToken, code, ipAddress, userAgent }) {
    const data = await mfaService.peekChallenge(challengeToken);
    if (!data) throw new AppError('MFA_CHALLENGE_EXPIRED', 'Enrollment challenge expired or invalid. Please log in again.', 401);

    const user = await userRepo.findById(data.userId);
    if (!user || user.status !== 'active') throw new AppError('UNAUTHORIZED', 'Account not found or inactive', 401);
    if (!user.mfa_pending_secret) throw new AppError('MFA_NOT_INITIALIZED', 'MFA setup not started', 400);

    // Throws INVALID_MFA_CODE on a wrong code.
    mfaService.confirmSetup(user.mfa_pending_secret, code);

    // Activate MFA, then burn the single-use enrollment challenge.
    await userRepo.updateMfa(user.id, { secret: user.mfa_pending_secret, enabled: true, pendingSecret: null });
    await mfaService.consumeChallenge(challengeToken);
    await auditRepo.append({ userId: user.id, orgId: data.orgId, action: 'user.mfa_enabled', ipAddress });

    // Defense-in-depth: if the org was suspended mid-enrollment, do not hand out a session.
    const orgId = data.orgId || null;
    if (orgId) {
        const org = await orgRepo.findById(orgId);
        if (org && org.status === 'suspended') {
            throw new AppError('ORG_SUSPENDED', 'Organization is suspended. Contact the platform administrator.', 403);
        }
    }

    const fresh   = await userRepo.findById(user.id);
    const session = await sessionRepo.create({ userId: user.id, orgId, ipAddress, userAgent });
    const tokens  = await issueTokenPair(fresh, orgId, session.id, uuidv4());
    await enrichSessionSafe(session.id, user.id, ipAddress, userAgent);

    await userRepo.setLastLogin(user.id).catch(() => {});
    await auditRepo.append({ userId: user.id, orgId, action: 'user.login', ipAddress, metadata: { mfa: true, enrollment: true } });
    eventBus.publish('auth.mfa_enabled', { userId: String(user.id), email: user.email }).catch(() => {});

    return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt:    tokens.expiresAt,
        user:         presentUser(fresh, { orgId, orgType: tokens.orgType, role: tokens.role }),
    };
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

    // MFA gate — mirror login(): the invite joins the org, but a session is minted only after the
    // second factor clears. A brand-new invited user has neither flag set, so this is a no-op for
    // the common case; it ONLY bites an existing user who already has MFA (or an unmet force-MFA
    // mandate), closing the acceptInvite MFA-bypass. Completion runs through the same
    // /mfa-challenge and /mfa-enroll flows as login, which create the session against invitation.org_id.
    if (user.mfa_enabled) {
        const challengeToken = await mfaService.createChallenge({ userId: user.id, orgId: invitation.org_id, ipAddress, userAgent });
        await auditRepo.append({ userId: user.id, orgId: invitation.org_id, action: 'user.invite_mfa_required', ipAddress });
        return { mfa_required: true, challengeToken };
    }
    if (user.mfa_required && !user.mfa_enabled) {
        const challengeToken = await mfaService.createChallenge({ userId: user.id, orgId: invitation.org_id, ipAddress, userAgent });
        await auditRepo.append({ userId: user.id, orgId: invitation.org_id, action: 'user.invite_mfa_enrollment_required', ipAddress });
        return { mfa_enrollment_required: true, challengeToken };
    }

    const session = await sessionRepo.create({ userId: user.id, orgId: invitation.org_id, ipAddress, userAgent });
    const tokens  = await issueTokenPair(user, invitation.org_id, session.id, uuidv4());
    await enrichSessionSafe(session.id, user.id, ipAddress, userAgent);

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
    enrollMfaStart,
    enrollMfaComplete,
    listSessions,
    revokeSession,
    revokeAllSessions,
    getAuditLogs,
    validateInvite,
    acceptInvite,
    verifyToken,
    // Exposed for the social-login flow (service/oauthLogin.js) so OAuth reuses the
    // exact RS256 issuance + user presentation as password login.
    issueTokenPair,
    presentUser,
};
