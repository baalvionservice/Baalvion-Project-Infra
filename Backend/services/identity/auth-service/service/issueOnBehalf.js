'use strict';
// Dual-issue window (Phase 4): mint a CANONICAL RS256 token on behalf of a user that an
// island service (law/trade/elite-circle/insiders) has already authenticated locally.
// The user MUST already exist in auth.users (imported via scripts/import-island-users.mjs) with
// an active org membership. Mirrors authService.issueTokenPair's canonical issuance, access-only
// (no refresh) — the island login remains the auth event during the migration window.
const { userRepo, orgRepo, sessionRepo, auditRepo } = require('../repositories');
const jwt = require('../utils/jwtRsa');
const eventBus = require('../utils/eventBus');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
// C4: keep platform/tenant roles separate on this dual-issue path too.
const { assertNoRoleConfusion, isPlatformRole } = require('@baalvion/auth-node');

async function issueOnBehalf({ email, service, ipAddress, userAgent }) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AppError('USER_NOT_FOUND', 'No canonical identity for this email', 404);
    if (user.status && user.status !== 'active') throw new AppError('ACCOUNT_DISABLED', 'User account is not active', 403);

    const membership = await orgRepo.getPrimaryMembership(user.id);
    if (!membership) throw new AppError('NO_MEMBERSHIP', 'User has no active organization membership', 403);

    const orgId        = membership.org_id;
    const role         = membership.role;
    const serviceRoles = membership.service_roles || {};
    const permissions  = Object.keys(serviceRoles);

    // C4: org-membership role must not be a platform role; carry an explicit platform grant if any.
    assertNoRoleConfusion(role);
    const platformRole = isPlatformRole(user.platform_role) ? user.platform_role : null;
    const roles = platformRole ? [platformRole, role] : [role];

    const session = await sessionRepo.create({ userId: user.id, orgId, ipAddress, userAgent });

    const accessToken = jwt.signAccessToken({
        sub: user.id, email: user.email, orgId, role, roles, permissions, sid: session.id,
    });

    await auditRepo.append({
        userId: user.id, orgId, action: 'auth.issue_on_behalf',
        metadata: { service: service || null, email: user.email }, ipAddress,
    });
    try {
        if (eventBus && typeof eventBus.publish === 'function') {
            eventBus.publish('auth.issue_on_behalf', { userId: String(user.id), orgId, service: service || null });
        }
    } catch (_) { /* event bus best-effort */ }

    return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: config.jwt.accessExpiresIn,
        sub:       String(user.id),
        org_id:    orgId,
        sid:       session.id,
        roles,
    };
}

module.exports = { issueOnBehalf };
