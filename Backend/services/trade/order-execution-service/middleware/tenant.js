'use strict';
/**
 * R1: establish the per-request tenant context and enforce it.
 * Uses @baalvion/tenancy AsyncLocalStorage; the Sequelize transaction patch in
 * models/index.js sets the Postgres GUCs (app.current_tenant / app.tenant_bypass)
 * so RLS filters every row inside a transaction. super_admin / admin / owner bypass.
 */
const { tenantMiddleware, requireTenant } = require('@baalvion/tenancy');

const resolve = (req, bypassRoles) => {
    const auth = req.auth || {};
    const roles = Array.isArray(auth.roles) ? auth.roles : [];
    const bypass = roles.some((r) => bypassRoles.includes(r));
    const tenantId = auth.tenantId || auth.orgId || req.headers['x-tenant-id'] || null;
    return { tenantId: tenantId ? String(tenantId) : null, bypass };
};

const tenant = tenantMiddleware({ resolve, bypassRoles: ['super_admin', 'admin', 'owner'] });

module.exports = { tenant, requireTenant };
