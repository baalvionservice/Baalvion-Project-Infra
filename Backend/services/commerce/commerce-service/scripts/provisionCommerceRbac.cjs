'use strict';
/**
 * One-time, idempotent provisioning of the commerce RBAC model into the rbac-service.
 *
 * Registers the commerce permission catalogue, creates the assignable store-team roles,
 * attaches grants (incl. extending country_admin / organization_admin with commerce
 * permissions), and mirrors every existing commerce store into the RBAC tenant tree
 * (platform → country → store).
 *
 * Auth: POST /permissions, POST /roles (platform tenant) and POST /tenants (country) are
 * super_admin-only, so this needs a SUPER-ADMIN bearer token. The service key (X-Internal-Key)
 * is NOT accepted on those endpoints.
 *
 *   RBAC_PROVISION_TOKEN="<super-admin RS256 access token>" \
 *   RBAC_BASE_URL=http://localhost:3055 \
 *   node scripts/provisionCommerceRbac.cjs
 */
const rbacClient = require('../service/rbacClient');
const { COMMERCE_STORE_ROLES } = require('../service/commerceAuthz');
const tenantSync = require('../service/rbacTenantSync');
const { CommerceStore, connectDB, sequelize } = require('../models');

const TOKEN = process.env.RBAC_PROVISION_TOKEN || '';
const opts = { token: TOKEN };

// ── Commerce permission catalogue ───────────────────────────────────────────────
const PERMISSIONS = [
    ['commerce.store', 'read'], ['commerce.store', 'create'], ['commerce.store', 'update'],
    ['commerce.store', 'delete'], ['commerce.store', 'manage'],
    ['commerce.product', 'read'], ['commerce.product', 'create'], ['commerce.product', 'update'],
    ['commerce.product', 'publish'], ['commerce.product', 'delete'], ['commerce.product', 'manage'],
    ['commerce.catalog', 'read'], ['commerce.catalog', 'manage'],
    ['commerce.order', 'read'], ['commerce.order', 'manage'],
    ['commerce.inventory', 'read'], ['commerce.inventory', 'manage'],
    ['commerce.discount', 'read'], ['commerce.discount', 'manage'],
    ['commerce.seo', 'manage'],
    ['commerce.team', 'read'], ['commerce.team', 'manage'],
];

// role key → permission keys (allow). super_admin already holds *:*.
const ROLE_GRANTS = {
    store_admin: ['commerce.store:manage', 'commerce.product:manage', 'commerce.catalog:manage',
        'commerce.order:manage', 'commerce.inventory:manage', 'commerce.discount:manage',
        'commerce.seo:manage', 'commerce.team:manage'],
    product_manager: ['commerce.product:manage', 'commerce.catalog:manage', 'commerce.seo:manage', 'commerce.store:read'],
    ops_manager: ['commerce.order:manage', 'commerce.inventory:manage', 'commerce.store:read', 'commerce.product:read'],
    seo_manager: ['commerce.seo:manage', 'commerce.product:update', 'commerce.catalog:read', 'commerce.store:read'],
    store_viewer: ['commerce.store:read', 'commerce.product:read', 'commerce.order:read', 'commerce.catalog:read'],
    // System roles extended with commerce scope (enforcement scoping handled by the PEP).
    country_admin: ['commerce.store:manage', 'commerce.product:manage', 'commerce.catalog:manage',
        'commerce.order:manage', 'commerce.inventory:manage', 'commerce.discount:manage',
        'commerce.seo:manage', 'commerce.team:manage'],
    organization_admin: ['commerce.store:manage', 'commerce.product:manage', 'commerce.catalog:manage',
        'commerce.order:manage', 'commerce.team:manage'],
};

const asRows = (r) => (Array.isArray(r) ? r : (r && r.data) || []);
const isConflict = (err) => err && (err.statusCode === 409 || /exist|conflict|duplicate/i.test(err.message || ''));

async function ensurePermissions() {
    const existing = new Map(asRows(await rbacClient.listPermissions(opts)).map((p) => [p.key, p.id]));
    for (const [resource, action] of PERMISSIONS) {
        const key = `${resource}:${action}`;
        if (existing.has(key)) continue;
        try {
            const created = await rbacClient.createPermission({ resource, action, name: key, module: 'commerce' }, opts);
            existing.set(key, created.id);
            console.log(`  + permission ${key}`);
        } catch (err) {
            if (!isConflict(err)) throw err;
        }
    }
    // Refresh to capture any that already existed / raced.
    return new Map(asRows(await rbacClient.listPermissions(opts)).map((p) => [p.key, p.id]));
}

async function findRoleByKey(tenantId, key) {
    const rows = asRows(await rbacClient.listRoles({ tenantId, key, includeSystem: true }, opts));
    return rows.find((r) => r.key === key) || null;
}

async function ensureStoreRoles(platformTenantId) {
    const roleIds = {};
    for (const def of COMMERCE_STORE_ROLES) {
        let role = await findRoleByKey(platformTenantId, def.key);
        if (!role) {
            try {
                role = await rbacClient.createRole({
                    tenantId: platformTenantId, key: def.key, name: def.name,
                    scopeType: 'organization', level: def.rbacLevel, isAssignable: true, description: def.description,
                }, opts);
                console.log(`  + role ${def.key}`);
            } catch (err) {
                if (!isConflict(err)) throw err;
                role = await findRoleByKey(platformTenantId, def.key);
            }
        }
        if (role) roleIds[def.key] = role.id;
    }
    return roleIds;
}

async function attachGrants(roleIds, permByKey) {
    for (const [roleKey, permKeys] of Object.entries(ROLE_GRANTS)) {
        const roleId = roleIds[roleKey];
        if (!roleId) { console.warn(`  ! role ${roleKey} not found — skipping grants`); continue; }
        for (const permKey of permKeys) {
            const permissionId = permByKey.get(permKey);
            if (!permissionId) { console.warn(`  ! permission ${permKey} missing`); continue; }
            try {
                await rbacClient.attachPermission(roleId, { permissionId, effect: 'allow' }, opts);
            } catch (err) {
                if (!isConflict(err)) throw err;
            }
        }
        console.log(`  ✓ grants for ${roleKey}`);
    }
}

async function syncStores() {
    await connectDB();
    const stores = await CommerceStore.findAll({ attributes: ['id', 'name', 'countryCode'] });
    const countries = [...new Set(stores.map((s) => String(s.countryCode).toUpperCase()))];
    for (const cc of countries) {
        await tenantSync.ensureCountryTenant(cc, TOKEN);
        console.log(`  ✓ country tenant ${cc}`);
    }
    for (const s of stores) {
        await tenantSync.syncStoreToRbac({ id: s.id, name: s.name, countryCode: String(s.countryCode).toUpperCase() }, TOKEN);
    }
    console.log(`  ✓ ${stores.length} store tenant(s) synced`);
}

async function main() {
    if (!TOKEN) {
        console.error('RBAC_PROVISION_TOKEN is required (a super-admin RS256 access token).');
        process.exit(1);
    }
    console.log('[provision] permissions…');
    const permByKey = await ensurePermissions();

    console.log('[provision] resolving platform tenant…');
    const platformTenantId = await tenantSync.getPlatformTenantId(TOKEN);

    console.log('[provision] store-team roles…');
    const storeRoleIds = await ensureStoreRoles(platformTenantId);

    console.log('[provision] resolving system roles…');
    const roleIds = { ...storeRoleIds };
    for (const sys of ['country_admin', 'organization_admin']) {
        const r = await findRoleByKey(platformTenantId, sys);
        if (r) roleIds[sys] = r.id;
    }

    console.log('[provision] attaching grants…');
    await attachGrants(roleIds, permByKey);

    console.log('[provision] syncing commerce stores → RBAC tenants…');
    await syncStores();

    console.log('[provision] ✅ done');
}

main()
    .then(() => sequelize.close())
    .then(() => process.exit(0))
    .catch((err) => { console.error('[provision] failed:', err.message); process.exit(1); });
