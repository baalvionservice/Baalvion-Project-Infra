import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  analyseQuorum,
  loadTreasuryPolicy,
  validateTreasuryPolicy,
} from '../token/src/treasury.ts';
import { join } from 'node:path';
import { REPO_ROOT } from '../token/src/guards.ts';
import { load, mutate } from './helpers.ts';

const good = load('token', 'treasury-policy.json');
const errorsOf = (doc: unknown): string => {
  const r = validateTreasuryPolicy(doc);
  assert.equal(r.ok, false);
  return r.errors.join('\n');
};

describe('treasury multisig design (3-of-5)', () => {
  it('committed policy is valid and describes design only', () => {
    assert.equal(validateTreasuryPolicy(good).ok, true);
    assert.equal(good['status'], 'design');
    assert.equal(good['implementation'].status, 'not-yet-implemented');
  });

  it('is 3-of-5 with at least one independent signer and no names or addresses', () => {
    const policy = loadTreasuryPolicy(join(REPO_ROOT, 'token', 'treasury-policy.json'));
    const m = policy.treasuryMultisig;
    assert.equal(m.threshold, 3);
    assert.equal(m.signerCount, 5);
    assert.equal(m.signerSlots.length, 5);
    assert.ok(
      m.signerSlots.every(
        (s) => (s.identity as unknown) === null && (s.address as unknown) === null,
      ),
    );
    assert.ok(analyseQuorum(policy).independentSlots >= 1);
  });

  it('records the known limitation: with one independent slot, the other four can reach 3 alone', () => {
    const policy = loadTreasuryPolicy(join(REPO_ROOT, 'token', 'treasury-policy.json'));
    assert.deepEqual(analyseQuorum(policy), {
      independentSlots: 1,
      nonIndependentSlots: 4,
      nonIndependentCanReachThreshold: true,
    });
  });

  it('recovery requirements cover loss, compromise, unavailability, rotation and quorum loss', () => {
    const ids = good['treasuryMultisig'].recovery.map((r: { id: string }) => r.id);
    assert.deepEqual(ids, [
      'signer-key-loss',
      'signer-compromise',
      'signer-unavailability',
      'signer-rotation',
      'quorum-loss',
    ]);
  });

  it('rejects other thresholds or sizes', () => {
    assert.match(
      errorsOf(mutate(good, (d) => (d['treasuryMultisig'].threshold = 2))),
      /threshold must be 3/,
    );
    assert.match(
      errorsOf(mutate(good, (d) => (d['treasuryMultisig'].signerCount = 7))),
      /signerCount must be 5/,
    );
  });

  it('rejects zero independent signers', () => {
    const bad = mutate(good, (d) => {
      d['treasuryMultisig'].signerSlots[0].affiliation = 'team';
    });
    assert.match(errorsOf(bad), /only 0 independent signer slot/);
    assert.match(
      errorsOf(mutate(good, (d) => (d['treasuryMultisig'].minIndependentSigners = 0))),
      /at least 1/,
    );
  });

  it('rejects named signers and wallet addresses', () => {
    assert.match(
      errorsOf(mutate(good, (d) => (d['treasuryMultisig'].signerSlots[1].identity = 'Someone'))),
      /signers are not named yet/,
    );
    assert.match(
      errorsOf(mutate(good, (d) => (d['treasuryMultisig'].signerSlots[1].address = 'addr'))),
      /no wallets exist yet/,
    );
  });

  it('rejects missing recovery requirements, duplicate slots, and claims of implementation', () => {
    assert.match(
      errorsOf(mutate(good, (d) => d['treasuryMultisig'].recovery.pop())),
      /quorum-loss" is missing/,
    );
    assert.match(
      errorsOf(mutate(good, (d) => (d['treasuryMultisig'].signerSlots[2].slot = 1))),
      /duplicated/,
    );
    assert.match(
      errorsOf(mutate(good, (d) => (d['implementation'].status = 'implemented'))),
      /not-yet-implemented/,
    );
    assert.match(errorsOf(mutate(good, (d) => (d['status'] = 'live'))), /must be "design"/);
  });

  it('rejects non-objects and unknown fields', () => {
    for (const junk of [null, [], 'x']) assert.equal(validateTreasuryPolicy(junk).ok, false);
    assert.match(errorsOf(mutate(good, (d) => (d['privateKey'] = 'x'))), /not an allowed field/);
  });
});
