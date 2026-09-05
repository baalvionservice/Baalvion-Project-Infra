'use strict';
/**
 * Per-business access grants — the non-CMS half of one-panel access control.
 *
 * Site access already had a home; trade, jobs and IR did not, so one person working across
 * two products meant two grants in two systems. These grants are issued centrally and travel
 * in the access token, which makes their validation the only thing standing between the
 * console and every app that trusts that token.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { KNOWN_BUSINESSES, BUSINESS_ROLES, assertValidGrant } = require('../service/businessAccessService');

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();
const rejects = (grant, pattern) =>
  assert.throws(() => assertValidGrant(grant), (e) => {
    assert.equal(e.statusCode ?? e.status, 422);
    if (pattern) assert.match(e.message, pattern);
    return true;
  });

// ── catalogue integrity ──────────────────────────────────────────────────────
test('every known business declares a role list', () => {
  for (const b of KNOWN_BUSINESSES) {
    assert.ok(Array.isArray(BUSINESS_ROLES[b]), `${b} has no roles`);
    assert.ok(BUSINESS_ROLES[b].length > 0, `${b} has an empty role list`);
  }
});

test('no role list is declared for a business that does not exist', () => {
  for (const b of Object.keys(BUSINESS_ROLES)) {
    assert.ok(KNOWN_BUSINESSES.includes(b), `${b} has roles but is not a known business`);
  }
});

test('every business offers a read-only role, so access can be granted without write', () => {
  for (const b of KNOWN_BUSINESSES) {
    assert.ok(BUSINESS_ROLES[b].includes('viewer'), `${b} has no viewer role`);
  }
});

test('businesses keep their OWN vocabularies rather than one forced set', () => {
  // A recruiter means nothing in trade; compliance means nothing in jobs. Forcing a single
  // list across three domains produces roles that fit none of them.
  assert.ok(BUSINESS_ROLES.jobs.includes('recruiter'));
  assert.ok(!BUSINESS_ROLES.trade.includes('recruiter'));
  assert.ok(BUSINESS_ROLES.trade.includes('compliance'));
  assert.ok(!BUSINESS_ROLES.jobs.includes('compliance'));
});

// ── validation ───────────────────────────────────────────────────────────────
test('a valid grant passes', () => {
  assert.doesNotThrow(() => assertValidGrant({ business: 'trade', role: 'ops', expiresAt: null }));
  assert.doesNotThrow(() => assertValidGrant({ business: 'jobs', role: 'recruiter', expiresAt: inDays(30) }));
});

test('an unknown business is refused', () => {
  rejects({ business: 'atlantis', role: 'admin' }, /Unknown business/);
});

test('a role valid elsewhere is refused for the wrong business', () => {
  // 'recruiter' is real — just not in trade. Cross-business role bleed is the subtle case.
  rejects({ business: 'trade', role: 'recruiter' }, /not valid for trade/);
});

test('an invented role is refused', () => {
  rejects({ business: 'trade', role: 'wizard' }, /not valid/);
});

test('a past expiry is refused — access dead on arrival is a silent failure', () => {
  rejects({ business: 'trade', role: 'ops', expiresAt: inDays(-1) }, /future/);
});

test('an expiry beyond two years is refused so a typo cannot outlive review', () => {
  rejects({ business: 'trade', role: 'ops', expiresAt: '2999-01-01T00:00:00Z' }, /two years/);
});

test('a non-date expiry is refused', () => {
  rejects({ business: 'trade', role: 'ops', expiresAt: 'next tuesday' }, /date/);
});

test('a null expiry means a standing grant and is allowed', () => {
  assert.doesNotThrow(() => assertValidGrant({ business: 'ir', role: 'viewer', expiresAt: null }));
  assert.doesNotThrow(() => assertValidGrant({ business: 'ir', role: 'viewer' }));
});

test('validation is case-sensitive — "Trade" is not "trade"', () => {
  // Accepting variants would let two spellings of one business drift apart in the token.
  rejects({ business: 'Trade', role: 'ops' });
  rejects({ business: 'trade', role: 'Ops' });
});
