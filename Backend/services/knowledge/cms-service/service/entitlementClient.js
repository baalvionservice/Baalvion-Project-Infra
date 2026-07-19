'use strict';
const { decideAccess } = require('@baalvion/entitlements');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');

const CACHE_TTL_MS = 30_000; // short — a just-purchased subscription should reflect quickly
const _subscriptionCache = new Map(); // userId -> { at, subscription }

// DB-backed lookup, called through imperialpedia-service's internal resolver — that service
// is the sole owner of the subscriptions/plans tables (see its
// controller/entitlementInternalController.js). Returns null on a cache miss for an anonymous
// caller, and THROWS (does not silently return null) when the remote call itself fails, so the
// caller can fail closed rather than mistake "resolver unreachable" for "no subscription".
async function getSubscription(userId) {
    if (!userId) return null;

    const cached = _subscriptionCache.get(userId);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.subscription;

    const url = `${config.imperialpedia.baseUrl}/internal/entitlements/${encodeURIComponent(userId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
        const res = await fetch(url, {
            headers: { 'x-internal-secret': config.internalSecret },
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`entitlement resolver responded ${res.status}`);
        const body = await res.json();
        const subscription = body.data ? body.data.subscription : null;
        _subscriptionCache.set(userId, { at: Date.now(), subscription });
        return subscription;
    } finally {
        clearTimeout(timeout);
    }
}

// Resolves premium access for one piece of content. Non-premium content never calls the remote
// resolver at all (matches imperialpedia-service's own short-circuit in decideAccess).
//
// IMPORTANT — fails CLOSED, the opposite of this service's vault-fetch pattern
// (service/payments-adjacent integration resolvers fail open to a cached/env fallback because a
// missing payment-provider config shouldn't block an unrelated request). A paywall must never
// grant access because a network call to imperialpedia-service timed out or errored.
async function resolveAccess({ userId, isPremiumContent }) {
    if (!isPremiumContent) return decideAccess({ isPremiumContent: false, subscription: null });

    try {
        const subscription = await getSubscription(userId);
        return decideAccess({ isPremiumContent: true, subscription });
    } catch (err) {
        logger('entitlementClient').warn({ err: err.message, userId: userId || null }, 'entitlement resolver unreachable — denying premium access (fail closed)');
        return { isPremium: true, hasAccess: false, requiredTier: 'tier-pro', currentTier: 'unknown' };
    }
}

module.exports = { getSubscription, resolveAccess };
