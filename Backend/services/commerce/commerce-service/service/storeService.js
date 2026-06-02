'use strict';
const { Op } = require('sequelize');
const { CommerceStore } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const commerceAuthz = require('./commerceAuthz');
const rbacClient = require('./rbacClient');
const { syncStoreToRbac } = require('./rbacTenantSync');

// NOTE (Phase 1): store authority moved to the RBAC service. getStore/updateStore/deleteStore
// are no longer filtered by the caller's token orgId — the route's loadStoreRole has already
// authorized the caller via RBAC (which correctly handles cross-org super/country admins).
// Member CRUD delegates to RBAC; no commerce_store_members writes remain.

async function invalidateStoreCaches(store) {
    await cache.del(cache.keys.store(store.id));
    await cache.del(`commerce:rbac:scope:${store.id}`);
    if (store.organizationId) await cache.delPattern(`commerce:stores:org:${store.organizationId}*`);
}

/**
 * List stores scoped to the caller's RBAC access (country + store grants). Backend-enforced:
 * a country_admin sees only their country's stores; a store_admin only their store(s); a
 * super_admin sees all. A caller with no commerce scope gets an empty page — never raw rows.
 * @param {{unrestricted:boolean, allowedCountries:string[], allowedStoreIds:string[]}} scope
 */
async function listStores(scope, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = {};
    if (query.status) where.status = query.status;
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    if (!scope || !scope.unrestricted) {
        const countries = ((scope && scope.allowedCountries) || []).map((c) => String(c).toUpperCase());
        const storeIds = (scope && scope.allowedStoreIds) || [];
        if (!countries.length && !storeIds.length) {
            return buildPaginated([], 0, { page, limit }); // no scope → no data (fail-closed)
        }
        const or = [];
        if (countries.length) or.push({ countryCode: { [Op.in]: countries } });
        if (storeIds.length) or.push({ id: { [Op.in]: storeIds } });
        where[Op.or] = or;
    }

    const { rows, count } = await CommerceStore.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function getStore(storeId) {
    const cached = await cache.get(cache.keys.store(storeId));
    if (cached) return cached;
    const store = await CommerceStore.findByPk(storeId);
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    const data = store.toJSON();
    await cache.set(cache.keys.store(storeId), data, config.cache.storeTtl);
    return data;
}

/**
 * Create a store. Authorized by RBAC: only a super_admin or the country_admin for
 * body.countryCode may create stores. On success the store is mirrored into the RBAC
 * tenant tree and the creator is granted store_admin (so they can manage its team).
 * @param {{userId:string, token:string, orgId:string, jwtRoles:string[]}} authCtx
 */
async function createStore(authCtx, body) {
    // Fail-closed identity checks: RBAC management calls require the caller's token, and a
    // store must belong to an org. authMiddleware already guarantees both, but assert explicitly.
    if (!authCtx.token) throw new AppError('UNAUTHORIZED', 'Authorization token required', 401);
    if (!authCtx.orgId) throw new AppError('BAD_REQUEST', 'orgId is required on the caller identity', 400);
    const countryCode = commerceAuthz.normCountry(body.countryCode);
    const allowed = await commerceAuthz.canAdministerCountry({
        userId: authCtx.userId, token: authCtx.token, countryCode, jwtRoles: authCtx.jwtRoles,
    });
    if (!allowed) {
        throw new AppError('FORBIDDEN', `You must be super_admin or the country_admin for ${countryCode} to create a store there`, 403);
    }

    const existing = await CommerceStore.findOne({ where: { code: body.code } });
    if (existing) throw new AppError('CONFLICT', 'A store with this code already exists', 409);

    const store = await CommerceStore.create({ ...body, organizationId: authCtx.orgId, createdBy: authCtx.userId });

    // Mirror into RBAC + grant creator store_admin. Best-effort rollback if provisioning fails,
    // so we never leave a store nobody can administer.
    try {
        await syncStoreToRbac(store.toJSON(), authCtx.token);
        const roleId = await commerceAuthz.resolveRoleIdByKey('store_admin', authCtx.token);
        if (!roleId) throw new AppError('RBAC_NOT_PROVISIONED', "RBAC role 'store_admin' is missing. Run scripts/provisionCommerceRbac.cjs.", 409);
        await rbacClient.assignRole({ userId: String(authCtx.userId), roleId, scopeId: store.id }, { token: authCtx.token });
        await commerceAuthz.invalidateUser(authCtx.userId);
    } catch (err) {
        await store.destroy().catch(() => {});
        throw err;
    }

    await cache.delPattern(`commerce:stores:org:${authCtx.orgId}*`);
    return store.toJSON();
}

async function updateStore(storeId, body) {
    const store = await CommerceStore.findByPk(storeId);
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    await store.update(body);
    await invalidateStoreCaches(store);
    return store.toJSON();
}

async function deleteStore(storeId) {
    const store = await CommerceStore.findByPk(storeId);
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    const snapshot = store.toJSON();
    await store.destroy();
    await invalidateStoreCaches(snapshot);
}

// ── Store team (delegated to RBAC) ──────────────────────────────────────────────
// These re-point the legacy member endpoints onto RBAC assignments at scope_id=storeId.
// The caller's token is forwarded so RBAC enforces requireScopeAdmin (a country_admin may
// manage stores in their country; a store_admin only their own store).

const STORE_ROLE_KEYS = new Set(commerceAuthz.COMMERCE_STORE_ROLES.map((r) => r.key));

function serializeMember(a) {
    return {
        assignmentId: a.id,
        userId: a.userId,
        role: a.role ? a.role.key : null,
        roleName: a.role ? a.role.name : null,
        scopeId: a.scopeId,
        status: a.status,
        expiresAt: a.expiresAt,
        grantedBy: a.grantedBy,
    };
}

async function listMembers(storeId, token) {
    const rows = await rbacClient.listAssignments({ scopeId: storeId, status: 'active' }, { token });
    const list = Array.isArray(rows) ? rows : (rows && rows.data) || [];
    return list.filter((a) => a.role && STORE_ROLE_KEYS.has(a.role.key)).map(serializeMember);
}

async function addMember(storeId, { userId, role }, token) {
    const roleId = await commerceAuthz.resolveRoleIdByKey(role, token);
    if (!roleId) throw new AppError('RBAC_NOT_PROVISIONED', `RBAC role '${role}' is missing. Run scripts/provisionCommerceRbac.cjs.`, 409);
    const assignment = await rbacClient.assignRole({ userId: String(userId), roleId, scopeId: storeId }, { token });
    await commerceAuthz.invalidateUser(userId);
    return serializeMember(assignment);
}

// Revoke a set of assignments resiliently: tolerate 404 (already revoked — idempotent under
// concurrent admins) but surface any other failure instead of leaving a partial revocation.
async function revokeAll(assignmentIds, token) {
    const settled = await Promise.allSettled(assignmentIds.map((id) => rbacClient.revokeAssignment(id, { token })));
    const hardFailure = settled.find((s) => s.status === 'rejected' && s.reason && s.reason.statusCode !== 404);
    if (hardFailure) throw hardFailure.reason;
}

async function updateMemberRole(storeId, userId, role, token) {
    // RBAC assignments are immutable role↔scope grants; "change role" = revoke other store
    // roles at this store, then grant the target. The target grant is idempotent.
    const current = await listMembers(storeId, token);
    const mine = current.filter((m) => String(m.userId) === String(userId));
    await revokeAll(mine.filter((m) => m.role !== role).map((m) => m.assignmentId), token);
    const result = await addMember(storeId, { userId, role }, token);
    await commerceAuthz.invalidateUser(userId);
    return result;
}

async function removeMember(storeId, userId, token) {
    const current = await listMembers(storeId, token);
    const mine = current.filter((m) => String(m.userId) === String(userId));
    if (!mine.length) throw new AppError('NOT_FOUND', 'Member not found', 404);
    await revokeAll(mine.map((m) => m.assignmentId), token);
    await commerceAuthz.invalidateUser(userId);
}

module.exports = { listStores, getStore, createStore, updateStore, deleteStore, listMembers, addMember, updateMemberRole, removeMember };
