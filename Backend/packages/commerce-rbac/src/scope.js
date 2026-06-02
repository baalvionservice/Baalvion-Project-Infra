'use strict';
// The Policy Enforcement Point's brain (shared). RBAC is the source of truth for WHO holds
// WHICH role in WHICH scope; this resolves the part RBAC cannot at decision time: mapping an
// addressed store to its scope chain ['*', countryCode, storeId] and deriving the caller's
// effective capability. The RBAC PDP matches scope by EXACT string, so the PEP owns hierarchy.
const {
    RBAC_ROLE_TO_CAPABILITY,
    SUPER_ADMIN_RBAC_LEVEL,
    COUNTRY_ADMIN_RBAC_LEVEL,
    normCountry,
} = require('./capability');
const { isUnreachable } = require('./errors');
const { NOOP_AUDIT } = require('./audit');

/**
 * @param {object} deps
 * @param {object} deps.rbacClient   from createRbacClient
 * @param {object} deps.cache        { get(k), set(k,v,ttl), del(k) }
 * @param {object} deps.config       { failMode, breakglassSuperAdmin, effectiveTtl }
 * @param {object} [deps.audit]      audit emitter (for breakglass)
 * @param {string} [deps.keyPrefix='commerce-rbac']
 */
function createScopeResolver({ rbacClient, cache, config = {}, audit = NOOP_AUDIT, keyPrefix = 'commerce-rbac' } = {}) {
    const failMode = (config.failMode || 'closed').toLowerCase();
    const breakglass = config.breakglassSuperAdmin !== false;
    const effectiveTtl = Number(config.effectiveTtl || 30);

    async function getEffective(userId, token) {
        const cacheKey = `${keyPrefix}:eff:${userId}`;
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
        const eff = await rbacClient.getUserEffective(userId, { token });
        await cache.set(cacheKey, eff, effectiveTtl);
        return eff;
    }

    function isGlobalSuperAdmin(eff) {
        return Boolean(eff && (
            (Array.isArray(eff.roles) && eff.roles.includes('super_admin')) ||
            (Number(eff.maxLevel) || 0) >= SUPER_ADMIN_RBAC_LEVEL
        ));
    }

    function breakglassAllowed(err, jwtRoles) {
        return isUnreachable(err) && breakglass && Array.isArray(jwtRoles) && jwtRoles.includes('super_admin');
    }

    /** @returns {{role, level, viaScope, breakglass?}} */
    async function resolveStoreCapability({ userId, token, store, jwtRoles = [] }) {
        let eff;
        try {
            eff = await getEffective(userId, token);
        } catch (err) {
            if (breakglassAllowed(err, jwtRoles)) {
                audit.breakglass({ userId, role: 'super_admin', scope: { type: 'store', id: store && store.id }, action: 'resolveStoreCapability', reason: 'rbac_unreachable' });
                return { role: 'super_admin', level: 100, viaScope: 'breakglass', breakglass: true };
            }
            if (isUnreachable(err) && failMode === 'open') return { role: null, level: 0, viaScope: null };
            throw err; // fail-closed (default): propagate 503
        }

        if (isGlobalSuperAdmin(eff)) return { role: 'super_admin', level: 100, viaScope: '*' };

        const candidateScopes = ['*', store.countryCode, store.id].filter(Boolean);
        let best = { role: null, level: 0, viaScope: null };
        for (const scopeId of candidateScopes) {
            const bucket = eff.perScope && eff.perScope[scopeId];
            if (!bucket || !Array.isArray(bucket.roles)) continue;
            for (const roleKey of bucket.roles) {
                const lvl = RBAC_ROLE_TO_CAPABILITY[roleKey] ?? 0;
                if (lvl > best.level) best = { role: roleKey, level: lvl, viaScope: scopeId };
            }
        }
        return best;
    }

    /** Cross-store data scope: { unrestricted, allowedCountries[], allowedStoreIds[] }. */
    async function resolveAccessScope({ userId, token, jwtRoles = [] }) {
        let eff;
        try {
            eff = await getEffective(userId, token);
        } catch (err) {
            if (breakglassAllowed(err, jwtRoles)) {
                audit.breakglass({ userId, role: 'super_admin', action: 'resolveAccessScope', reason: 'rbac_unreachable' });
                return { unrestricted: true, allowedCountries: [], allowedStoreIds: [], breakglass: true };
            }
            throw err; // middleware applies fail policy
        }
        if (isGlobalSuperAdmin(eff)) return { unrestricted: true, allowedCountries: [], allowedStoreIds: [] };

        const allowedCountries = new Set();
        const allowedStoreIds = new Set();
        for (const [scopeId, bucket] of Object.entries(eff.perScope || {})) {
            const roles = Array.isArray(bucket.roles) ? bucket.roles : [];
            const hasCap = roles.some((r) => (RBAC_ROLE_TO_CAPABILITY[r] ?? 0) > 0);
            if (!hasCap) continue;
            if (scopeId === '*') return { unrestricted: true, allowedCountries: [], allowedStoreIds: [] };
            if (bucket.scopeType === 'country') allowedCountries.add(normCountry(scopeId));
            else if (bucket.scopeType === 'organization') allowedStoreIds.add(scopeId);
        }
        return { unrestricted: false, allowedCountries: [...allowedCountries], allowedStoreIds: [...allowedStoreIds] };
    }

    async function canAdministerCountry({ userId, token, countryCode, jwtRoles = [] }) {
        const cc = normCountry(countryCode);
        let eff;
        try {
            eff = await getEffective(userId, token);
        } catch (err) {
            if (breakglassAllowed(err, jwtRoles)) { audit.breakglass({ userId, role: 'super_admin', scope: { type: 'country', id: cc }, action: 'canAdministerCountry', reason: 'rbac_unreachable' }); return true; }
            throw err;
        }
        if (isGlobalSuperAdmin(eff)) return true;
        const bucket = eff.perScope && eff.perScope[cc];
        if (!bucket) return false;
        const roles = Array.isArray(bucket.roles) ? bucket.roles : [];
        return roles.includes('country_admin') || (Number(bucket.level) || 0) >= COUNTRY_ADMIN_RBAC_LEVEL;
    }

    async function resolveRoleIdByKey(roleKey, token) {
        const cacheKey = `${keyPrefix}:roleid:${roleKey}`;
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
        const result = await rbacClient.listRoles({ key: roleKey, includeSystem: true }, { token });
        const rows = Array.isArray(result) ? result : (result && result.data) || [];
        const match = rows.find((r) => r.key === roleKey) || rows[0];
        if (!match) return null;
        await cache.set(cacheKey, match.id, 3600);
        return match.id;
    }

    async function invalidateUser(userId) {
        await cache.del(`${keyPrefix}:eff:${userId}`);
    }

    return {
        getEffective,
        isGlobalSuperAdmin,
        resolveStoreCapability,
        resolveAccessScope,
        canAdministerCountry,
        resolveRoleIdByKey,
        invalidateUser,
    };
}

module.exports = { createScopeResolver };
