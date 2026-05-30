'use strict';
/**
 * Gateway identity bridge — JIT local-identity provisioning (insiders island).
 *
 * The canonical auth path (Phase 6E-8) delivers a CENTRAL identity: the auth-gateway
 * verifies an auth-service RS256 session and injects signed identity headers, which
 * bffBridge turns into `req.auth = { userId: <auth-service id>, roles, ... , source:'gateway' }`.
 *
 * This island, however, keys ALL of its data — profiles, ownership columns, foreign
 * keys to `users`, and notification triggers — by a LOCAL `users.id` UUID. The central
 * id (e.g. "54") is neither a UUID nor present in `insiders.users`, so owner-scoped
 * reads and any FK-bearing insert would fail.
 *
 * Bridge: map each gateway identity to a STABLE local UUID (uuidv5 over the central id),
 * ensure the backing users/profiles/default-role rows exist (idempotent, process-cached),
 * then rewrite `req.auth.userId` to that local UUID so every policy / owner-scope / insert
 * keeps working unchanged. The island's own role model (admin/moderator/premium/user from
 * `user_roles`) is reflected back into `req.auth.roles`, so the documented admin-granting
 * recipe (`insert into insiders.user_roles(user_id, role) values (<localId>, 'admin')`)
 * still drives RBAC under gateway auth.
 *
 * Pure-ish: only DB side-effects (findOrCreate). No-op for anonymous / non-gateway callers.
 */
const { v5: uuidv5 } = require('uuid');
const db = require('../models');

// Fixed namespace → the central-id → local-UUID mapping is deterministic across deploys.
const INSIDERS_NS = '6f5b2c9e-1d3a-4b8e-9c2f-2a7e4d6b1c30';

// Roles the island understands (matches the app_role enum). Gateway roles outside this
// set (e.g. org-level 'owner') are not insiders RBAC roles and are ignored here.
const APP_ROLES = new Set(['admin', 'moderator', 'premium', 'user']);

// gatewayUserId → true once its backing rows have been ensured this process.
const provisioned = new Set();

const localIdFor = (gatewayUserId) => uuidv5(`insiders:${gatewayUserId}`, INSIDERS_NS);

async function ensureRows(gatewayUserId, localId, gatewayRoles) {
    // 1) users row (login is delegated to auth-service; password_hash is a non-usable placeholder).
    await db.User.findOrCreate({
        where: { id: localId },
        defaults: {
            id: localId,
            email: `gw_${gatewayUserId}@gateway.baalvion.local`,
            password_hash: 'gateway-managed',
            email_verified: true,
            is_active: true,
        },
    });
    // 2) profile (id == users.id). Default role 'founder' to match the onboarding/paywall flow.
    await db.Profile.findOrCreate({
        where: { id: localId },
        defaults: { id: localId, username: `user_${gatewayUserId}`, role: 'founder' },
    });
    // 3) baseline 'user' role + any app-valid gateway roles → user_roles.
    const want = new Set(['user']);
    for (const r of gatewayRoles || []) if (APP_ROLES.has(r)) want.add(r);
    for (const role of want) {
        await db.UserRole.findOrCreate({ where: { user_id: localId, role }, defaults: { user_id: localId, role } });
    }
}

/**
 * Translate the gateway identity into the local identity + ensure backing rows.
 * Safe no-op when there is no gateway-sourced auth on the request.
 */
async function ensureLocalIdentity(req) {
    const a = req.auth;
    if (!a || a.source !== 'gateway' || !a.userId) return;

    const gatewayUserId = String(a.userId);
    const localId = localIdFor(gatewayUserId);
    a.gatewayUserId = gatewayUserId; // keep the central id for audit/trace
    a.userId = localId;              // everything downstream keys off the local UUID

    if (!provisioned.has(gatewayUserId)) {
        try {
            await ensureRows(gatewayUserId, localId, a.roles);
            provisioned.add(gatewayUserId);
        } catch (e) {
            // Idempotent rows → don't hard-fail the request on a provisioning race; retry next request.
            console.warn('[insiders] gateway identity provisioning deferred:', e.message);
        }
    }

    // Reflect the island's own RBAC (user_roles) into req.auth.roles, merged with app-valid
    // gateway roles. Keeps insiders admin/moderator/premium working under central auth.
    try {
        const rows = await db.UserRole.findAll({ where: { user_id: localId }, attributes: ['role'] });
        const merged = new Set(rows.map((r) => r.role));
        for (const r of a.roles || []) if (APP_ROLES.has(r)) merged.add(r);
        a.roles = Array.from(merged);
    } catch { /* on error keep the gateway-provided roles */ }
}

module.exports = { ensureLocalIdentity, localIdFor };
