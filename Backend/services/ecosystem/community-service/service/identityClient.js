'use strict';
// Resolves a platform userId → email, needed only for the admin/moderator-initiated paths
// (join-request approval, manual grant/revoke) where the acting user's own token doesn't carry
// the TARGET user's email — self-service paths (join/redeemInvite) instead decode email
// straight off the caller's own bearer token (see controller/*), no cross-service call needed.
//
// ⚠ VERIFY AT EXECUTION TIME: exact identity-service internal lookup route/contract — this
// calls the same internal-service-secret pattern used elsewhere (e.g. insiders-service's
// billingRoutes.js), but the concrete path below is a best-effort guess, not a confirmed one.
// Degrades gracefully either way: membershipService's NodeBB sync no-ops when email can't be
// resolved, so the platform membership state (the authoritative record) is never blocked on this.
const config = require('../config/appConfig');

const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://app-identity:3023';

async function getEmailByUserId(userId) {
    if (!userId) return null;
    try {
        const res = await fetch(`${IDENTITY_SERVICE_URL}/internal/users/${encodeURIComponent(userId)}`, {
            headers: { 'x-internal-secret': config.internal.serviceSecret, 'x-internal-service': 'community-service' },
        });
        if (!res.ok) return null;
        const body = await res.json().catch(() => ({}));
        return body?.data?.email || body?.email || null;
    } catch {
        return null;
    }
}

module.exports = { getEmailByUserId };
