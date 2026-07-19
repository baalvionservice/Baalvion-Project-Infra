'use strict';

// Thin wiring smoke test — the full decideAccess rule suite now lives canonically in
// Backend/packages/entitlements/test/decideAccess.test.js (the shared source of truth). This
// file only proves imperialpedia-service's entitlementService.js re-exports the SAME function
// (not a fork of it) and that its own additions (loadSubscriptionForUser, resolveArticleAccess)
// exist with the expected shape. No live database, no network.

const test = require('node:test');
const assert = require('node:assert/strict');

const entitlementService = require('../service/entitlementService');
const shared = require('@baalvion/entitlements');

test('decideAccess is re-exported verbatim from @baalvion/entitlements, not reimplemented', () => {
    assert.equal(entitlementService.decideAccess, shared.decideAccess);
    assert.equal(entitlementService.MIN_PAID_TIER, shared.MIN_PAID_TIER);
    assert.equal(entitlementService.FREE_TIER, shared.FREE_TIER);
});

test('decideAccess still behaves correctly through the re-export', () => {
    const result = entitlementService.decideAccess({ isPremiumContent: true, subscription: null });
    assert.equal(result.hasAccess, false);
    assert.equal(result.requiredTier, shared.MIN_PAID_TIER);
});

test('loadSubscriptionForUser short-circuits to null for anonymous callers without touching the DB', async () => {
    // No userId → returns before the lazy `require('../models')` — safe to call with no DB/env
    // configured, which is exactly what makes this test runnable in the pure-logic suite.
    const result = await entitlementService.loadSubscriptionForUser(undefined);
    assert.equal(result, null);
});

test('entitlementService exposes the expected public surface', () => {
    assert.equal(typeof entitlementService.loadSubscriptionForUser, 'function');
    assert.equal(typeof entitlementService.resolveArticleAccess, 'function');
    assert.equal(typeof entitlementService.hasDataPackageAccess, 'function');
});

test('hasDataPackageAccess requires the top tier specifically, not just any active paid plan', () => {
    assert.equal(entitlementService.hasDataPackageAccess(null), false);
    assert.equal(entitlementService.hasDataPackageAccess({ status: 'active', tierKey: entitlementService.MIN_PAID_TIER }), false);
    assert.equal(entitlementService.hasDataPackageAccess({ status: 'active', tierKey: entitlementService.DATA_PACKAGE_TIER }), true);
    assert.equal(entitlementService.hasDataPackageAccess({ status: 'canceled', tierKey: entitlementService.DATA_PACKAGE_TIER }), false);
});
