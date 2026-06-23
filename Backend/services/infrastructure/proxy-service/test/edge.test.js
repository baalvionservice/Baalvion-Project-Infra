'use strict';

// Global edge-network pure-logic tests — `npm test` (node --test), no DB/Redis.

const { test } = require('node:test');
const assert = require('node:assert');

require('../_env'); // dummy auth/billing secrets so the fail-loud config boots under CI (no .env)
const asn = require('../service/asnIntelService');
const edge = require('../service/edgeRegionService');

// ── ASN reputation ───────────────────────────────────────────────────────────
test('asn: clean ASN (no bans, full success) scores high', () => {
  const rep = asn.computeReputation({ banRate: 0, successRate: 100 });
  assert.strictEqual(rep, 100);
});

test('asn: fully banned + zero success scores 0', () => {
  const rep = asn.computeReputation({ banRate: 1, successRate: 0 });
  assert.strictEqual(rep, 0);
});

test('asn: reputation is monotonic in ban rate', () => {
  const low = asn.computeReputation({ banRate: 0.1, successRate: 90 });
  const high = asn.computeReputation({ banRate: 0.5, successRate: 90 });
  assert.ok(low > high, `expected ${low} > ${high}`);
});

test('asn: reputation clamped to 0..100 on out-of-range input', () => {
  const over = asn.computeReputation({ banRate: -5, successRate: 999 });
  const under = asn.computeReputation({ banRate: 5, successRate: -50 });
  assert.ok(over <= 100 && over >= 0, `over=${over}`);
  assert.ok(under <= 100 && under >= 0, `under=${under}`);
});

test('asn: defaults (no stats) treat ASN as fully successful, unbanned', () => {
  assert.strictEqual(asn.computeReputation(), 100);
  assert.strictEqual(asn.computeReputation({}), 100);
});

// ── Region selection ──────────────────────────────────────────────────────────
const REGIONS = [
  { code: 'us-east', continent: 'NA', status: 'healthy', weight: 100, enabled: true },
  { code: 'eu', continent: 'EU', status: 'healthy', weight: 100, enabled: true },
  { code: 'india', continent: 'IN', status: 'degraded', weight: 80, enabled: true },
  { code: 'sea', continent: 'SEA', status: 'healthy', weight: 60, enabled: true },
];

test('region: picks the continent-local region for the target country', () => {
  const r = edge.pickRegion('de', REGIONS); // Germany → EU
  assert.strictEqual(r.code, 'eu');
});

test('region: India target lands on the IN region even when degraded', () => {
  const r = edge.pickRegion('in', REGIONS);
  assert.strictEqual(r.code, 'india');
});

test('region: unknown continent falls back to a healthy region by weight', () => {
  const r = edge.pickRegion('zz', REGIONS); // no continent match → global pool
  assert.ok(r.status === 'healthy');
  assert.strictEqual(r.code, 'us-east'); // highest-weight healthy
});

test('region: prefers healthy over degraded within the same continent', () => {
  const regions = [
    { code: 'in-a', continent: 'IN', status: 'degraded', weight: 100, enabled: true },
    { code: 'in-b', continent: 'IN', status: 'healthy', weight: 50, enabled: true },
  ];
  const r = edge.pickRegion('in', regions);
  assert.strictEqual(r.code, 'in-b');
});

test('region: returns null when every region is offline/disabled', () => {
  const dead = REGIONS.map((r) => ({ ...r, status: 'offline' }));
  assert.strictEqual(edge.pickRegion('us', dead), null);
  const disabled = REGIONS.map((r) => ({ ...r, enabled: false }));
  assert.strictEqual(edge.pickRegion('us', disabled), null);
});

test('region: skips offline continent-local region, still serves from global pool', () => {
  const regions = [
    { code: 'eu', continent: 'EU', status: 'offline', weight: 100, enabled: true },
    { code: 'us-east', continent: 'NA', status: 'healthy', weight: 90, enabled: true },
  ];
  const r = edge.pickRegion('fr', regions); // France → EU, but EU offline
  assert.strictEqual(r.code, 'us-east');
});
