'use strict';
/**
 * R1: establish the per-request tenant context and enforce it.
 * Uses @baalvion/tenancy AsyncLocalStorage; the Sequelize transaction patch in
 * models/index.js sets the Postgres GUCs (app.current_tenant / app.tenant_bypass)
 * so RLS filters every row inside a transaction. Only platform operators (PLATFORM_BYPASS_ROLES) bypass; tenant roles never do (C4).
 */
const { tenantMiddleware, requireTenant, PLATFORM_BYPASS_ROLES } = require('@baalvion/tenancy');

const resolve = (req, bypassRoles) => {
    const auth = req.auth || {};
    const roles = Array.isArray(auth.roles) ? auth.roles : [];
    const bypass = roles.some((r) => bypassRoles.includes(r));
    const tenantId = auth.tenantId || auth.orgId || req.headers['x-tenant-id'] || null;
    return { tenantId: tenantId ? String(tenantId) : null, bypass };
};

const tenant = tenantMiddleware({ resolve, bypassRoles: PLATFORM_BYPASS_ROLES });

module.exports = { tenant, requireTenant };
