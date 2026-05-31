'use strict';
/**
 * Consistent, collision-safe cache keys: `<namespace>[:t:<tenant>]:<parts>`.
 * Tenant scoping prevents cross-tenant cache bleed (a tenant must never read
 * another tenant's cached value).
 */
function buildKey(namespace, parts, tenant) {
    const base = Array.isArray(parts) ? parts.filter((p) => p != null).join(':') : String(parts);
    return tenant ? `${namespace}:t:${tenant}:${base}` : `${namespace}:${base}`;
}

/**
 * Resolve the tenant segment for a key. Explicit `tenant` wins; otherwise, when
 * tenantScoped, read the ambient @baalvion/tenancy context (bypass/none → 'global').
 */
function resolveTenant({ tenant, tenantScoped } = {}) {
    if (tenant != null) return String(tenant);
    if (!tenantScoped) return null;
    try {
        const { getTenantContext } = require('@baalvion/tenancy');
        const ctx = getTenantContext();
        if (ctx.bypass || !ctx.tenantId) return 'global';
        return String(ctx.tenantId);
    } catch { return 'global'; }
}

module.exports = { buildKey, resolveTenant };
