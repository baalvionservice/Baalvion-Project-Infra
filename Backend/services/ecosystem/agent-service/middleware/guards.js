'use strict';
const { Errors } = require('../utils/errors');

// Managing agents / plans / commissions / training is privileged. Service principals pass.
const AGENT_ADMIN_ROLES = ['super_admin', 'owner', 'admin', 'sales_manager', 'agent_manager', 'finance', 'service'];

// Roles that may perform write/financial operations (commission transitions, payouts).
// agents:read is intentionally excluded — read-only callers must not mutate financial state.
const AGENT_WRITE_ROLES = ['super_admin', 'owner', 'admin', 'sales_manager', 'agent_manager', 'finance', 'service'];

const requireAgentAdmin = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => AGENT_ADMIN_ROLES.includes(r)) || perms.includes('*') || perms.includes('agents:write') || perms.includes('agents:read');
    return ok ? next() : next(Errors.forbidden('Requires an agent-admin role or agents:* permission'));
};

/**
 * Stricter guard for write/financial operations (commission transitions, agent payouts).
 * agents:read permission is NOT sufficient — the caller must hold agents:write, a
 * wildcard, or a qualifying admin/finance role.  Internal service-to-service paths
 * (req.internal) are still allowed through unchanged.
 */
const requireAgentWrite = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => AGENT_WRITE_ROLES.includes(r)) || perms.includes('*') || perms.includes('agents:write');
    return ok ? next() : next(Errors.forbidden('Requires agents:write permission or a finance/admin role'));
};

// Platform/org admins are unscoped; everyone else is scoped to their org.
const orgScope = (req) => {
    const roles = req.auth?.roles || [];
    const perms = req.auth?.permissions || [];
    const isPlatform = req.internal || roles.includes('super_admin') || roles.includes('owner') || perms.includes('*');
    return isPlatform ? null : (req.auth?.orgId ?? null);
};

module.exports = { requireAgentAdmin, requireAgentWrite, orgScope };
