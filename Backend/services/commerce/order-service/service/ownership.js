'use strict';
// Customer-ownership enforcement (IDOR defense) for shopper-facing resources. Verified HERE in
// the service layer — never the frontend. Policy = OWNER **OR** GUEST-SESSION OWNER **OR** STORE STAFF:
//   - a record may be accessed by the customer who owns it (resource.userId === caller userId), OR
//   - by the holder of the signed guest session bound to it (resource.sessionId === actor.sessionId), OR
//   - by store staff/admin (any RBAC store role) — so admin access is unchanged.
// Cheap checks first (no RBAC); staff is resolved lazily only when ownership fails.
// Failures emit a structured commerce.ownership_violation audit and return 403.
const { AppError } = require('../utils/errors');
const { audit } = require('../middleware/rbacPep');
const { safeEqual } = require('../utils/sessionToken');

const isOwner = (ownerUserId, actor) =>
    ownerUserId != null && actor && actor.userId != null && String(ownerUserId) === String(actor.userId);

// Guest ownership: the caller presented a valid signed session matching the resource's bound
// session id (e.g. a guest cart). Constant-time compare; never matches when either side is null.
const isSessionOwner = (ownerSessionId, actor) =>
    ownerSessionId != null && actor && actor.sessionId != null && safeEqual(ownerSessionId, actor.sessionId);

function denied(actor, ctx, reason) {
    try {
        audit.emit({
            type: 'commerce.ownership_violation',
            decision: 'deny',
            userId: actor && actor.userId != null ? String(actor.userId) : null,
            role: null,
            scope: { type: 'store', id: ctx.storeId },
            action: ctx.action,
            resource: { type: ctx.resourceType, id: ctx.resourceId },
            reason,
            requestId: actor && actor.requestId,
        });
    } catch { /* auditing must never break or slow the request */ }
    return new AppError('FORBIDDEN', 'You do not have access to this resource', 403);
}

/**
 * @param {{userId:any, sessionId?:string, requestId?:string, isStaff?:()=>Promise<boolean>}} actor
 * @param {any} ownerUserId  the resource owner's user id (null = no resolvable user owner)
 * @param {{resourceType:string, resourceId:string, storeId:string, action:string, ownerSessionId?:string}} ctx
 */
async function enforce(actor, ownerUserId, ctx = {}) {
    const hasIdentity = actor && (actor.userId != null || actor.sessionId != null);
    if (!hasIdentity) throw denied(actor, ctx, 'no_identity'); // anonymous with no session proof
    if (isOwner(ownerUserId, actor)) return;                    // authenticated owner
    if (isSessionOwner(ctx.ownerSessionId, actor)) return;      // guest session owner
    if (actor.isStaff && (await actor.isStaff())) return;       // store staff/admin
    const reason = ctx.ownerSessionId != null && !isSessionOwner(ctx.ownerSessionId, actor)
        ? 'session_mismatch'
        : (ownerUserId == null ? 'no_owner_not_staff' : 'not_owner');
    throw denied(actor, ctx, reason);
}

module.exports = { enforce, isOwner, isSessionOwner };
