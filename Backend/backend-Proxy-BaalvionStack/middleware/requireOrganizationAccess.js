'use strict';

/**
 * Centralized organization access guard. Runs AFTER authMiddleware or
 * apiKeyAuth. It is the single authority on whether the caller may act inside
 * the organization carried by their credential.
 *
 * It validates, against the database (with a short Redis cache):
 *   - the organization exists and is active (not suspended/deleted)
 *   - for USER callers: an ACTIVE membership row links user -> org
 *   - the membership role is authoritative (overrides any stale token role)
 *   - for API-KEY callers: the key already proves single-org ownership
 *
 * On success it attaches a sanitized `req.organization` and refreshes
 * `req.auth.role`/`permissions` from the DB membership.
 */

const db = require('../models');
const { getRedis } = require('../service/redisClient');
const { expandPermissions } = require('../service/rbac');
const { AppError } = require('../utils/errors');
const logger = require('../service/logger');

const MEMBERSHIP_TTL = Number(process.env.MEMBERSHIP_CACHE_TTL || 30); // seconds
const membKey = (orgId, userId) => `memb:${orgId}:${userId}`;

async function loadOrganization(orgId) {
  const org = await db.organizations.findByPk(orgId);
  if (!org) return null;
  return { id: org.id, slug: org.slug, name: org.name, plan: org.plan_slug, status: org.status };
}

async function resolveMembershipRole(orgId, userId) {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(membKey(orgId, userId));
      if (cached) return cached === '__none__' ? null : cached;
    } catch (err) {
      logger.error('[org] membership cache read failed:', err.message);
    }
  }

  const membership = await db.org_memberships.findOne({
    where: { org_id: orgId, user_id: userId, status: 'active' },
  });
  const role = membership ? membership.role : null;

  if (redis) {
    try { await redis.set(membKey(orgId, userId), role || '__none__', 'EX', MEMBERSHIP_TTL); } catch (_) {}
  }
  return role;
}

async function requireOrganizationAccess(req, res, next) {
  try {
    const auth = req.auth;
    if (!auth || !auth.organizationId) {
      return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    }

    const org = await loadOrganization(auth.organizationId);
    if (!org) return next(new AppError('ORG_NOT_FOUND', 'Organization not found', 404));
    if (org.status && org.status !== 'active') {
      return next(new AppError('ORG_SUSPENDED', 'Organization is suspended', 403));
    }

    if (auth.authType === 'user') {
      // Account must still be active.
      const user = await db.users.findByPk(auth.userId);
      if (!user) return next(new AppError('USER_NOT_FOUND', 'User not found', 401));
      if (user.status && user.status !== 'active') {
        return next(new AppError('ACCOUNT_DISABLED', 'User account is not active', 403));
      }

      let effectiveRole = await resolveMembershipRole(org.id, auth.userId);

      // Home organization fallback: the user's denormalized `users.org_id`
      // grants implicit access with their base role even before an explicit
      // org_memberships row exists (e.g. the owner created at registration).
      // This is a trusted server-side value, NOT client input.
      if (!effectiveRole && String(user.org_id) === String(org.id)) {
        effectiveRole = user.role || 'viewer';
      }

      if (!effectiveRole) {
        return next(new AppError('FORBIDDEN', 'No active membership for this organization', 403));
      }

      // DB-derived role is authoritative — never trust a stale token role.
      // Resolve effective permissions through the dynamic RBAC engine so any
      // custom role + inheritance is included (falls back to built-in static).
      auth.role = effectiveRole;
      try {
        auth.permissions = await require('../service/rbacService').resolveForUser(org.id, effectiveRole, user.custom_role_id);
      } catch (_) {
        auth.permissions = expandPermissions(effectiveRole, []);
      }
      req.user.role = effectiveRole;
    }
    // API-key callers: ownership already proven by apiKeyAuth; org active check above suffices.

    req.organization = { id: org.id, slug: org.slug, plan: org.plan, status: org.status };
    return next();
  } catch (err) {
    logger.error('[org] access check failed:', err.message);
    return next(new AppError('FORBIDDEN', 'Organization access denied', 403));
  }
}

module.exports = requireOrganizationAccess;
module.exports.requireOrganizationAccess = requireOrganizationAccess;
