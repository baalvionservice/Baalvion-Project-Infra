import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { decideAccess, decideEntitlement, activeEntitlements, grantFromObligation } = require('../index.js');

const NOW = new Date('2026-06-01T00:00:00Z');
const grant = (over = {}) => ({
  id: 'g1', partyId: 'party_1', featureKey: 'premium-content', tier: 'tier-pro',
  scope: { siteIds: ['imperialpedia'] },
  validFrom: new Date('2026-01-01T00:00:00Z'), validUntil: new Date('2027-01-01T00:00:00Z'),
  status: 'active', ...over,
});

// ---------------------------------------------------------------- the point of the package

test('a GROUP-scoped grant earned on one property unlocks another', () => {
  // Paid on marketunderworld; the membership is estate-wide.
  const g = grant({ scope: 'GROUP', source: { siteId: 'insiders' } });
  assert.equal(decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW }).hasAccess, true);
  assert.equal(decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'law', asOf: NOW }).hasAccess, true);
});

test('a site-scoped grant does not leak to other properties', () => {
  const g = grant();
  assert.equal(decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW }).hasAccess, true);
  const other = decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'law', asOf: NOW });
  assert.equal(other.hasAccess, false);
  // "Held, but not here" is materially different from "not held" — support needs the distinction.
  assert.equal(other.reason, 'out_of_scope');
});

// ---------------------------------------------------------------- lifetime

test('access starts and ends with the period actually paid for', () => {
  const g = grant();
  assert.equal(decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: new Date('2025-12-31T00:00:00Z') }).hasAccess, false);
  assert.equal(decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: new Date('2027-01-01T00:00:00Z') }).reason, 'expired');
});

test('cancelling keeps the time already bought, but never extends it', () => {
  const cancelled = grant({ status: 'cancelled' });
  assert.equal(decideEntitlement({ grants: [cancelled], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW }).hasAccess, true);
  assert.equal(decideEntitlement({ grants: [cancelled], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: new Date('2027-06-01T00:00:00Z') }).hasAccess, false);
});

test('a revoked grant is dead immediately', () => {
  const revoked = grant({ status: 'revoked' });
  assert.equal(decideEntitlement({ grants: [revoked], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW }).hasAccess, false);
});

// ---------------------------------------------------------------- tiers

test('a grant must meet the tier the content requires', () => {
  const basic = grant({ tier: 'tier-basic' });
  const low = decideEntitlement({ grants: [basic], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW, requiredTier: 'tier-pro' });
  assert.equal(low.hasAccess, false);
  assert.equal(low.reason, 'tier_too_low');
  assert.equal(low.currentTier, 'tier-basic');

  const elite = grant({ tier: 'tier-elite' });
  assert.equal(decideEntitlement({ grants: [elite], featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW, requiredTier: 'tier-pro' }).hasAccess, true);
});

test('the strongest held grant is the one reported', () => {
  const d = decideEntitlement({
    grants: [grant({ id: 'low', tier: 'tier-basic' }), grant({ id: 'high', tier: 'tier-elite' })],
    featureKey: 'premium-content', siteId: 'imperialpedia', asOf: NOW,
  });
  assert.equal(d.matched.id, 'high');
});

// ---------------------------------------------------------------- reasons + claims

test('reports why access was refused, not just that it was', () => {
  assert.equal(decideEntitlement({ grants: [], featureKey: 'premium-content', siteId: 'law', asOf: NOW }).reason, 'no_grant');
  assert.equal(decideEntitlement({ grants: [grant()], siteId: 'law', asOf: NOW }).reason, 'no_feature_requested');
});

test('lists everything a party holds on a site, best tier per feature', () => {
  const held = activeEntitlements({
    grants: [
      grant({ id: 'a', featureKey: 'premium-content', tier: 'tier-basic' }),
      grant({ id: 'b', featureKey: 'premium-content', tier: 'tier-elite' }),
      grant({ id: 'c', featureKey: 'community:founders', scope: 'GROUP' }),
      grant({ id: 'd', featureKey: 'expired-thing', validUntil: new Date('2026-02-01T00:00:00Z') }),
    ],
    siteId: 'imperialpedia', asOf: NOW,
  });
  assert.deepEqual(held.map((g) => g.featureKey).sort(), ['community:founders', 'premium-content']);
  assert.equal(held.find((g) => g.featureKey === 'premium-content').id, 'b');
});

// ---------------------------------------------------------------- derived from what was paid

test('a grant derived from an obligation matches the service period exactly', () => {
  const ob = {
    id: 'ob_1', siteId: 'law', paymentId: 'pay_9',
    serviceStart: new Date('2026-01-01T00:00:00Z'),
    serviceEnd: new Date('2027-01-01T00:00:00Z'),
  };
  const g = grantFromObligation({ id: 'g_1', partyId: 'p1', featureKey: 'premium-content', tier: 'tier-pro', obligation: ob });
  assert.equal(g.validFrom, ob.serviceStart);
  assert.equal(g.validUntil, ob.serviceEnd);
  assert.deepEqual(g.scope, { siteIds: ['law'] });
  assert.equal(g.source.paymentId, 'pay_9');
});

test('an early termination shortens the grant to when service actually stopped', () => {
  const ob = {
    id: 'ob_2', siteId: 'law',
    serviceStart: new Date('2026-01-01T00:00:00Z'),
    serviceEnd: new Date('2027-01-01T00:00:00Z'),
    terminatedAt: new Date('2026-04-01T00:00:00Z'),
  };
  const g = grantFromObligation({ id: 'g_2', partyId: 'p1', featureKey: 'premium-content', obligation: ob });
  assert.equal(g.validUntil, ob.terminatedAt);
  assert.equal(decideEntitlement({ grants: [g], featureKey: 'premium-content', siteId: 'law', asOf: NOW }).hasAccess, false);
});

// ---------------------------------------------------------------- the old rule still works

test('the existing per-site premium rule is unchanged', () => {
  assert.deepEqual(
    decideAccess({ isPremiumContent: true, subscription: { status: 'active', tierKey: 'tier-pro', currentPeriodEnd: '2027-01-01' } }),
    { isPremium: true, hasAccess: true, requiredTier: 'tier-pro', currentTier: 'tier-pro' },
  );
  assert.equal(decideAccess({ isPremiumContent: true, subscription: null }).hasAccess, false);
  assert.equal(decideAccess({ isPremiumContent: false, subscription: null }).hasAccess, true);
});
