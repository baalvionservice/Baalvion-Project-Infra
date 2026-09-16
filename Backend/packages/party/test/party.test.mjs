import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail, normalizePhone, normalizeName,
  matchKeys, resolveParty, planMerge, PartyError,
} from '../dist/index.mjs';

// ---------------------------------------------------------------- normalisation

test('email normalisation lowercases and trims, and nothing more', () => {
  assert.equal(normalizeEmail('  Wade@Example.COM '), 'wade@example.com');
  // Deliberately NOT stripped: dots are significant at many providers, and plus-tags are how
  // people keep genuinely separate accounts. Merging either joins different mailboxes.
  assert.equal(normalizeEmail('a.b@gmail.com'), 'a.b@gmail.com');
  assert.equal(normalizeEmail('a+shop@x.com'), 'a+shop@x.com');
});

test('rejects anything that is not an email rather than half-accepting it', () => {
  for (const bad of ['', '   ', 'nope', 'a@b', 'a b@c.com', '@x.com', 'a@.com', null, undefined, 42]) {
    assert.equal(normalizeEmail(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

test('a phone without a country code is not matchable across markets', () => {
  // 9876543210 is a different person in India and the US, so it resolves to nothing without
  // a calling code the caller supplies from the market it knows.
  assert.equal(normalizePhone('9876543210'), null);
  assert.equal(normalizePhone('9876543210', '91'), '+919876543210');
  assert.equal(normalizePhone('+91 98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+1 (415) 555-0132'), '+14155550132');
});

test('phone normalisation respects E.164 bounds and avoids double country codes', () => {
  assert.equal(normalizePhone('12345'), null);            // too short
  assert.equal(normalizePhone(`+${'9'.repeat(16)}`), null); // too long
  assert.equal(normalizePhone('919876543210', '91'), '+919876543210'); // already carries 91
  assert.equal(normalizeName('  Wade   Smith '), 'Wade Smith');
});

// ---------------------------------------------------------------- match keys

test('verified signals are strong, unverified are weak', () => {
  const keys = matchKeys({
    siteId: 'amarise', authUserId: 'u1',
    email: 'W@x.com', emailVerified: true,
    phone: '+919876543210', phoneVerified: false,
    siteCustomerId: 'cust_9',
  });
  const byKey = Object.fromEntries(keys.map((k) => [k.key, k.strength]));
  assert.equal(byKey['auth:u1'], 'STRONG');
  assert.equal(byKey['email:w@x.com'], 'STRONG');
  assert.equal(byKey['phone:+919876543210'], 'WEAK');
  // Site-scoped so two properties can never collide on their own customer numbering.
  assert.equal(byKey['site:amarise:cust_9'], 'STRONG');
});

test('a signal must say which property it came from', () => {
  assert.throws(() => matchKeys({ email: 'a@b.com' }), (e) => e instanceof PartyError && e.code === 'MISSING_SITE');
});

// ---------------------------------------------------------------- the safety rule

test('a verified email matches an existing party', () => {
  const r = resolveParty(
    { siteId: 'law', email: 'wade@x.com', emailVerified: true },
    [{ partyId: 'p1', keys: ['email:wade@x.com'] }],
  );
  assert.equal(r.outcome, 'MATCHED');
  assert.equal(r.partyId, 'p1');
});

test('an UNVERIFIED email never silently claims an existing party', () => {
  // The attack this prevents: type someone else's address at checkout and inherit their
  // payment history and entitlements.
  const r = resolveParty(
    { siteId: 'law', email: 'wade@x.com', emailVerified: false },
    [{ partyId: 'p1', keys: ['email:wade@x.com'] }],
  );
  assert.equal(r.outcome, 'UNVERIFIED');
  assert.equal(r.partyId, 'p1'); // attached provisionally…
  assert.match(r.reason, /review/); // …but flagged, never treated as proven
});

test('disagreeing verified signals stop rather than guess', () => {
  const r = resolveParty(
    { siteId: 'ctm', email: 'a@x.com', emailVerified: true, phone: '+919876543210', phoneVerified: true },
    [
      { partyId: 'p1', keys: ['email:a@x.com'] },
      { partyId: 'p2', keys: ['phone:+919876543210'] },
    ],
  );
  assert.equal(r.outcome, 'AMBIGUOUS');
  assert.equal(r.partyId, null);
  assert.deepEqual(r.conflicts.sort(), ['p1', 'p2']);
});

test('an unknown customer becomes a new party', () => {
  const r = resolveParty({ siteId: 'gti', email: 'new@x.com', emailVerified: true }, []);
  assert.equal(r.outcome, 'NEW');
  assert.equal(r.partyId, null);
});

test('a signal with nothing usable never merges anything', () => {
  const r = resolveParty({ siteId: 'gti', email: 'not-an-email' }, [{ partyId: 'p1', keys: ['email:a@x.com'] }]);
  assert.equal(r.outcome, 'NEW');
  assert.deepEqual(r.keys, []);
});

test('the same human on two properties resolves to one party', () => {
  // The point of the whole graph: bought on Amarisé, later subscribes on Law Elite.
  const known = [{ partyId: 'p1', keys: ['email:wade@x.com', 'site:amarise:cust_9'] }];
  const onLawElite = resolveParty({ siteId: 'law', email: 'Wade@X.com', emailVerified: true, siteCustomerId: 'sub_4' }, known);
  assert.equal(onLawElite.outcome, 'MATCHED');
  assert.equal(onLawElite.partyId, 'p1');
  // And the new site key is recorded so the next lookup matches directly.
  assert.ok(onLawElite.keys.some((k) => k.key === 'site:law:sub_4'));
});

// ---------------------------------------------------------------- merging

test('the oldest party survives a merge, so long-held references stay valid', () => {
  const plan = planMerge([
    { partyId: 'newer', keys: ['email:b@x.com'], createdAt: '2026-06-01' },
    { partyId: 'older', keys: ['email:a@x.com'], createdAt: '2025-01-01' },
  ]);
  assert.equal(plan.survivorId, 'older');
  assert.deepEqual(plan.mergedIds, ['newer']);
  assert.deepEqual(plan.keys.sort(), ['email:a@x.com', 'email:b@x.com']);
});

test('a merge needs at least two parties', () => {
  assert.throws(() => planMerge([{ partyId: 'p1', keys: [] }]), (e) => e.code === 'INVALID_MERGE');
});
