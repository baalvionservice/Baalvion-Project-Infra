'use strict';
const { Errors } = require('../utils/errors');

// Managing agents / plans / commissions / training is privileged. Service principals pass.
const AGENT_ADMIN_ROLES = ['super_admin', 'owner', 'admin', 'sales_manager', 'agent_manager', 'finance', 'service'];

const requireAgentAdmin = (req, res, next) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => AGENT_ADMIN_ROLES.includes(r)) || perms.includes('*') || perms.includes('agents:write') || perms.includes('agents:read');
    return ok ? next() : next(Errors.forbidden('Requires an agent-admin role or agents:* permission'));
};

// Platform/org admins are unscoped; everyone else is scoped to their org.
const orgScope = (req) => {
    const roles = req.auth?.roles || [];
    const perms = req.auth?.permissions || [];
    const isPlatform = req.internal || roles.includes('super_admin') || roles.includes('owner') || perms.includes('*');
    return isPlatform ? null : (req.auth?.orgId ?? null);
};

module.exports = { requireAgentAdmin, orgScope };
