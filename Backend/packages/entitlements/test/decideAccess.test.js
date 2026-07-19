'use strict';

// Canonical tests for the shared decideAccess rule. imperialpedia-service and cms-service both
// consume this package rather than reimplementing the rule — see their own test suites for thin
// wiring-only smoke tests, not a duplicate of this full suite.

const test = require('node:test');
const assert = require('node:assert/strict');

const { decideAccess, MIN_PAID_TIER, FREE_TIER } = require('../index');

test('free content is always accessible, regardless of subscription', () => {
    const anonymous = decideAccess({ isPremiumContent: false, subscription: null });
    assert.deepEqual(anonymous, { isPremium: false, hasAccess: true, requiredTier: null, currentTier: FREE_TIER });

    const subscribed = decideAccess({
        isPremiumContent: false,
        subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: futureDate() },
    });
    assert.equal(subscribed.hasAccess, true);
    assert.equal(subscribed.currentTier, 'tier-pro');
});

test('premium content is denied to a caller with no subscription', () => {
    const result = decideAccess({ isPremiumContent: true, subscription: null });
    assert.deepEqual(result, { isPremium: true, hasAccess: false, requiredTier: MIN_PAID_TIER, currentTier: FREE_TIER });
});

test('premium content is granted to an active paid subscriber', () => {
    const result = decideAccess({
        isPremiumContent: true,
        subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: futureDate() },
    });
    assert.equal(result.hasAccess, true);
    assert.equal(result.requiredTier, MIN_PAID_TIER);
});

test('premium content is granted to an active enterprise subscriber', () => {
    const result = decideAccess({
        isPremiumContent: true,
        subscription: { status: 'active', tierKey: 'tier-enterprise', currentPeriodEnd: futureDate() },
    });
    assert.equal(result.hasAccess, true);
});

test('premium content is denied to a subscriber on the free tier even if status is active', () => {
    const result = decideAccess({
        isPremiumContent: true,
        subscription: { status: 'active', tierKey: FREE_TIER, currentPeriodEnd: futureDate() },
    });
    assert.equal(result.hasAccess, false);
});

test('premium content is denied to a canceled or past_due subscriber', () => {
    assert.equal(decideAccess({
        isPremiumContent: true,
        subscription: { status: 'canceled', tierKey: 'tier-pro', currentPeriodEnd: futureDate() },
    }).hasAccess, false);
    assert.equal(decideAccess({
        isPremiumContent: true,
        subscription: { status: 'past_due', tierKey: 'tier-pro', currentPeriodEnd: futureDate() },
    }).hasAccess, false);
});

test('premium content is denied once current_period_end has passed, even if status is still active', () => {
    const result = decideAccess({
        isPremiumContent: true,
        subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: pastDate() },
    });
    assert.equal(result.hasAccess, false);
});

test('premium content with an active subscription that has no current_period_end is treated as not expired', () => {
    const result = decideAccess({
        isPremiumContent: true,
        subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: null },
    });
    assert.equal(result.hasAccess, true);
});

function futureDate() {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

function pastDate() {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}
