'use strict';

/**
 * Cross-site entitlement grants — the mechanism that makes many websites one company.
 *
 * `decideAccess` (index.js) answers "does this user have paid access", but only from a single
 * site's own subscription row. That cannot express the thing the platform is actually for:
 * paying on one property unlocking something on another. A grant can, because it hangs off the
 * group-wide `partyId` rather than a per-site customer, and carries its own scope.
 *
 *   scope 'GROUP'                  → holds everywhere in the estate
 *   scope { siteIds: ['law'] }     → holds on those properties only
 *
 * Pure and I/O-free, like everything else in this package: a service loads the party's grants
 * however it wishes and passes them in, so the RULE lives in exactly one place no matter how
 * many services enforce it.
 */

/**
 * Tier ladder. Higher outranks lower; a grant satisfies a requirement when its tier ranks at
 * least as high. Extended by passing `tierRank` rather than editing this, so a product with its
 * own ladder does not have to fight the default one.
 */
const DEFAULT_TIER_RANK = Object.freeze({
    'tier-free': 0,
    'tier-basic': 10,
    'tier-pro': 20,
    'tier-elite': 30,
});

const ACTIVE = 'active';

function toTime(value) {
    if (value == null) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** Does this grant's scope cover the site being asked about? */
function coversSite(grant, siteId) {
    const scope = grant.scope;
    if (scope === 'GROUP' || scope == null) return true;
    if (Array.isArray(scope)) return scope.includes(siteId);
    if (Array.isArray(scope.siteIds)) return scope.siteIds.includes(siteId);
    return false;
}

/**
 * Is the grant live at `asOf`?
 *
 * A cancelled subscription usually keeps its access to the end of the period already paid for,
 * so `status` alone is not the test — an expiry that has not yet been processed must not extend
 * access, and a cancellation must not revoke time already bought.
 */
function isLive(grant, asOfMs) {
    if (grant.status && grant.status !== ACTIVE && grant.status !== 'cancelled') return false;
    const from = toTime(grant.validFrom);
    const until = toTime(grant.validUntil);
    if (from != null && asOfMs < from) return false;
    if (until != null && asOfMs >= until) return false;
    return true;
}

/**
 * Decide whether a party holds an entitlement on a given site.
 *
 * Returns the matching grant so the caller can log or display WHY access was granted — "your
 * Baalvion membership" reads very differently from "your Law Elite subscription", and support
 * cannot answer an access question without it.
 */
function decideEntitlement({ grants, featureKey, siteId, asOf, requiredTier, tierRank } = {}) {
    const ranks = tierRank || DEFAULT_TIER_RANK;
    const asOfMs = toTime(asOf) ?? Date.now();
    const all = Array.isArray(grants) ? grants : [];

    if (!featureKey) {
        return { hasAccess: false, matched: null, reason: 'no_feature_requested' };
    }

    const candidates = all.filter((g) => g && g.featureKey === featureKey);
    if (candidates.length === 0) {
        return { hasAccess: false, matched: null, reason: 'no_grant' };
    }

    const scoped = candidates.filter((g) => coversSite(g, siteId));
    if (scoped.length === 0) {
        // The party holds this entitlement, but not on this property — a materially different
        // answer from "not entitled", and worth saying so.
        return { hasAccess: false, matched: null, reason: 'out_of_scope' };
    }

    const live = scoped.filter((g) => isLive(g, asOfMs));
    if (live.length === 0) {
        return { hasAccess: false, matched: null, reason: 'expired' };
    }

    const needed = requiredTier == null ? null : (ranks[requiredTier] ?? 0);
    // Best grant first, so the reported reason is the strongest entitlement the party holds.
    const ranked = live
        .map((g) => ({ grant: g, rank: g.tier == null ? 0 : (ranks[g.tier] ?? 0) }))
        .sort((a, b) => b.rank - a.rank);

    if (needed != null) {
        const sufficient = ranked.find((r) => r.rank >= needed);
        if (!sufficient) {
            return { hasAccess: false, matched: ranked[0].grant, reason: 'tier_too_low', currentTier: ranked[0].grant.tier ?? null, requiredTier };
        }
        return { hasAccess: true, matched: sufficient.grant, reason: 'granted', currentTier: sufficient.grant.tier ?? null, requiredTier };
    }

    return { hasAccess: true, matched: ranked[0].grant, reason: 'granted', currentTier: ranked[0].grant.tier ?? null, requiredTier: null };
}

/** Every feature key the party currently holds on a site — for building a session's claims. */
function activeEntitlements({ grants, siteId, asOf } = {}) {
    const asOfMs = toTime(asOf) ?? Date.now();
    const all = Array.isArray(grants) ? grants : [];
    const held = new Map();
    for (const g of all) {
        if (!g || !g.featureKey) continue;
        if (!coversSite(g, siteId) || !isLive(g, asOfMs)) continue;
        const existing = held.get(g.featureKey);
        if (!existing || (DEFAULT_TIER_RANK[g.tier] ?? 0) > (DEFAULT_TIER_RANK[existing.tier] ?? 0)) {
            held.set(g.featureKey, g);
        }
    }
    return [...held.values()];
}

/**
 * Build a grant from a paid performance obligation, so an entitlement's lifetime is exactly the
 * service period the customer paid for — not a separately-maintained date that can drift from it.
 */
function grantFromObligation({ id, partyId, featureKey, tier, scope, obligation, siteId, paymentId }) {
    return {
        id,
        partyId,
        featureKey,
        tier: tier ?? null,
        scope: scope ?? { siteIds: [siteId ?? obligation.siteId] },
        source: { siteId: siteId ?? obligation.siteId, paymentId: paymentId ?? obligation.paymentId ?? null, obligationId: obligation.id },
        validFrom: obligation.serviceStart,
        // A cancelled subscription keeps the time already paid for; only an early termination
        // shortens the grant.
        validUntil: obligation.terminatedAt && obligation.terminatedAt < obligation.serviceEnd
            ? obligation.terminatedAt
            : obligation.serviceEnd,
        status: ACTIVE,
    };
}

module.exports = {
    decideEntitlement,
    activeEntitlements,
    grantFromObligation,
    coversSite,
    isLive,
    DEFAULT_TIER_RANK,
};
