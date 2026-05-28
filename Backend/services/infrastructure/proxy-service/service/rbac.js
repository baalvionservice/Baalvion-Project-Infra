const rolePermissions = {
    platform_admin: ['*'],
    owner: ['*'],
    admin: [
        'proxy:view', 'proxy:create', 'proxy:update', 'proxy:delete',
        'preset:view', 'preset:create', 'preset:update', 'preset:delete',
        'billing:view', 'billing:update',
        'usage:view', 'analytics:view',
        'org:view', 'org:update', 'org:member:view', 'org:member:invite', 'org:member:update', 'org:member:remove',
        'user:view', 'user:invite', 'user:update', 'user:delete', 'user:suspend',
        'apikey:view', 'apikey:create', 'apikey:revoke',
        'security:view', 'security:update',
        'notification:view', 'notification:update',
        'audit:view', 'support:view', 'support:reply', 'dashboard:view', 'export:create',
        'feature-flag:view'
    ],
    finance: ['billing:view', 'billing:update', 'analytics:view', 'audit:view'],
    // alias of finance — canonical name used by the API key/role spec
    billing: ['billing:view', 'billing:update', 'analytics:view', 'usage:view', 'audit:view'],
    // technical user: full proxy + key management, no billing/org admin
    developer: [
        'proxy:view', 'proxy:create', 'proxy:update', 'proxy:delete',
        'preset:view', 'preset:create', 'preset:update', 'preset:delete',
        'apikey:view', 'apikey:create', 'apikey:revoke',
        'usage:view', 'analytics:view', 'dashboard:view', 'notification:view',
    ],
    support: ['proxy:view', 'usage:view', 'analytics:view', 'support:view', 'support:reply', 'notification:view'],
    viewer: ['proxy:view', 'preset:view', 'usage:view', 'analytics:view', 'org:view', 'user:view', 'billing:view', 'dashboard:view', 'notification:view', 'audit:view'],
    // canonical name for read-only
    readonly: ['proxy:view', 'preset:view', 'usage:view', 'analytics:view', 'org:view', 'billing:view', 'dashboard:view', 'notification:view'],
    restricted: ['dashboard:view'],
};

// API-key scopes → internal permissions. Scopes are the public, coarse-grained
// contract exposed to customers; permissions are the internal enforcement unit.
const scopePermissionMap = {
    // ── Canonical proxy/dev scopes ──
    'proxy:connect': ['proxy:view'],
    'proxy:rotate': ['proxy:view', 'proxy:update'],
    'proxy:sticky': ['proxy:view'],
    'usage:read': ['usage:view', 'analytics:view', 'dashboard:view'],
    'analytics:read': ['analytics:view', 'usage:view', 'dashboard:view'],
    'billing:read': ['billing:view'],
    'billing:write': ['billing:view', 'billing:update'],
    'org:admin': ['org:view', 'org:update', 'org:member:view', 'org:member:invite', 'org:member:update', 'org:member:remove'],
    'users:manage': ['user:view', 'user:invite', 'user:update', 'user:delete', 'user:suspend'],
    // ── Legacy aliases (Prompt 1) ──
    'proxies:read': ['proxy:view', 'preset:view'],
    'proxies:write': ['proxy:view', 'proxy:create', 'proxy:update', 'proxy:delete', 'preset:view', 'preset:create', 'preset:update', 'preset:delete'],
    'keys:read': ['apikey:view'],
    '*': ['*'],
};

const scopesToPermissions = (scopes = []) => {
    const perms = new Set();
    for (const scope of scopes) {
        for (const p of (scopePermissionMap[scope] || [])) perms.add(p);
    }
    return Array.from(perms);
};

const expandPermissions = (role, explicitPermissions = []) => {
    const base = rolePermissions[role] || [];
    return Array.from(new Set([...base, ...explicitPermissions]));
};

const hasPermission = (permissions, permission) => {
    if (!permission) {
        return true;
    }

    return permissions.includes('*') || permissions.includes(permission);
};

module.exports = {
    expandPermissions,
    hasPermission,
    rolePermissions,
    scopesToPermissions,
    scopePermissionMap,
};