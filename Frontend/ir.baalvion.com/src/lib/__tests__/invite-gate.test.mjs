import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The gate is TypeScript, so it is compiled with the real compiler and imported. Testing the
// actual source rather than a hand-maintained copy is the whole point — a copy drifts, and a
// gate that drifts from what ships is worse than no test.
import ts from 'typescript';

const src = readFileSync(fileURLToPath(new URL('../invite-gate.ts', import.meta.url)), 'utf8');
const { outputText: js } = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

const {
  configuredInvites, hashCode, constantTimeEquals, resolveCode, resolveInviteId,
  isInviteGated, PLACEMENT_CAP, REQUEST_ACCESS_PATH,
} = mod;

const sha = (s) => createHash('sha256').update(s).digest('hex');
const invitesFor = (...codes) =>
  JSON.stringify(codes.map((c, i) => ({ id: `inv_${i}`, label: `P${i}`, sha256: sha(c), expires: null })));

test('a code opens only its own invitation', async () => {
  const invites = configuredInvites({ IR_INVEST_INVITES: invitesFor('ALPHA', 'BRAVO') });
  assert.equal(invites.length, 2);
  assert.equal((await resolveCode('ALPHA', invites))?.id, 'inv_0');
  assert.equal((await resolveCode('BRAVO', invites))?.id, 'inv_1');
  assert.equal(await resolveCode('CHARLIE', invites), null);
});

// The whole reason for per-person codes: revoking one must not disturb anyone else.
test('revoking one invitation leaves the others working', async () => {
  const all = configuredInvites({ IR_INVEST_INVITES: invitesFor('ALPHA', 'BRAVO') });
  const remaining = all.filter((i) => i.id !== 'inv_0');
  assert.equal(await resolveCode('ALPHA', remaining), null);
  assert.equal((await resolveCode('BRAVO', remaining))?.id, 'inv_1');
});

test('an expired invitation stops working, and lasts through its final day', async () => {
  const raw = JSON.stringify([{ id: 'inv_x', label: 'X', sha256: sha('CODE'), expires: '2027-03-31' }]);
  const invites = configuredInvites({ IR_INVEST_INVITES: raw });
  assert.ok(await resolveCode('CODE', invites, new Date('2027-03-31T23:59:00Z')));
  assert.equal(await resolveCode('CODE', invites, new Date('2027-04-01T00:00:01Z')), null);
  assert.equal(resolveInviteId('inv_x', invites, new Date('2027-04-02T00:00:00Z')), null);
});

// Fail-closed is the property that matters most: a config problem must shut the funnel, not open it.
test('missing or malformed configuration yields no invitations', () => {
  assert.deepEqual(configuredInvites({}), []);
  assert.deepEqual(configuredInvites({ IR_INVEST_INVITES: '' }), []);
  assert.deepEqual(configuredInvites({ IR_INVEST_INVITES: 'not json' }), []);
  assert.deepEqual(configuredInvites({ IR_INVEST_INVITES: '{"id":"x"}' }), []);
});

test('entries that could never be redeemed are dropped', () => {
  const raw = JSON.stringify([
    { id: 'ok', sha256: sha('A') },
    { id: 'bad-hash', sha256: 'nope' },
    { id: '', sha256: sha('B') },
    { id: 'ok', sha256: sha('C') }, // duplicate id — would make the access log ambiguous
  ]);
  const invites = configuredInvites({ IR_INVEST_INVITES: raw });
  assert.deepEqual(invites.map((i) => i.id), ['ok']);
  assert.equal(invites[0].label, 'ok', 'label falls back to the id');
});

test('the code never appears in configuration', () => {
  const raw = invitesFor('SUPER-SECRET');
  assert.ok(!raw.includes('SUPER-SECRET'));
  assert.match(configuredInvites({ IR_INVEST_INVITES: raw })[0].sha256, /^[0-9a-f]{64}$/);
});

test('hashCode is SHA-256 hex', async () => {
  assert.equal(await hashCode('abc'), sha('abc'));
});

test('constantTimeEquals rejects length mismatches and near-misses', () => {
  assert.ok(constantTimeEquals('abcd', 'abcd'));
  assert.ok(!constantTimeEquals('abcd', 'abce'));
  assert.ok(!constantTimeEquals('abcd', 'abcde'));
});

test('the founder side is never gated, and the landing page stays reachable', () => {
  for (const p of ['/invest', '/invest/deals', '/onboarding', '/onboarding/step-2']) {
    assert.ok(isInviteGated(p), `${p} must be gated`);
  }
  for (const p of ['/invest/list-your-business', '/onboarding/business', REQUEST_ACCESS_PATH, '/financials', '/']) {
    assert.ok(!isInviteGated(p), `${p} must stay open`);
  }
});

test('the s.42 tripwire is the statutory number', () => {
  assert.equal(PLACEMENT_CAP, 200);
});
