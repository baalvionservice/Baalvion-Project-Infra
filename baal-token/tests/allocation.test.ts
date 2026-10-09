import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAllocationDocument, validateAllocationDocument } from '../token/src/allocation.ts';
import {
  parsePercentToBps,
  parseUint,
  formatBaseUnits,
  tokensToBaseUnits,
} from '../token/src/units.ts';
import { load, mutate } from './helpers.ts';

const good = load('token', 'allocation.json');

function errorsOf(doc: unknown): string {
  const result = validateAllocationDocument(doc);
  assert.equal(result.ok, false, 'expected the document to be rejected');
  return result.errors.join('\n');
}

describe('allocation.json (single source of truth)', () => {
  it('is valid', () => {
    assert.deepEqual(validateAllocationDocument(good), { ok: true, errors: [] });
  });

  it('matches the Phase 0 approved decisions exactly', () => {
    const doc = parseAllocationDocument(good);
    assert.equal(doc.token.totalSupplyTokens, '1000000000');
    assert.equal(doc.token.decimals, 9);
    assert.deepEqual(Object.fromEntries(doc.allocations.map((a) => [a.id, a.percent])), {
      'founder-team': '15',
      treasury: '20',
      'community-ecosystem': '30',
      'future-development': '12',
      liquidity: '10',
      'marketing-partnerships': '8',
      'operations-reserve': '5',
    });
    const founder = doc.allocations.find((a) => a.id === 'founder-team');
    assert.deepEqual(founder?.vesting, {
      type: 'cliff-linear',
      status: 'approved',
      releaseShape: 'zero-before-cliff-then-continuous-linear',
      monthCounting: 'calendar-months-utc-from-tge',
      cliffMonths: 12,
      linearMonths: 36,
      tgeUnlockPercent: '0',
    });
    assert.equal(doc.token.supplyPolicy.freezeAuthority, 'none');
    assert.equal(doc.token.supplyPolicy.mintAuthority, 'revoke-permanently');
  });

  it('allocates exactly 100% and exactly 1,000,000,000 tokens using integers', () => {
    const doc = parseAllocationDocument(good);
    const bps = doc.allocations.reduce((s, a) => s + (parsePercentToBps(a.percent) ?? 0n), 0n);
    const base = doc.allocations.reduce((s, a) => s + BigInt(a.baseUnits), 0n);
    const tokens = doc.allocations.reduce((s, a) => s + BigInt(a.tokens), 0n);
    assert.equal(bps, 10_000n);
    assert.equal(tokens, 1_000_000_000n);
    assert.equal(base, 10n ** 18n);
  });

  it('has no wallet addresses; non-founder schedules are TBD; circulation and enforcement are open', () => {
    const doc = parseAllocationDocument(good);
    assert.ok(doc.allocations.every((a) => (a.walletRole.address as unknown) === null));
    assert.equal(doc.circulation.status, 'tbd');
    assert.equal(doc.enforcement.status, 'open');
    const states = Object.fromEntries(doc.allocations.map((a) => [a.id, a.vesting.status]));
    assert.deepEqual(states, {
      'founder-team': 'approved',
      treasury: 'tbd',
      'community-ecosystem': 'tbd',
      'future-development': 'tbd',
      liquidity: 'tbd',
      'marketing-partnerships': 'tbd',
      'operations-reserve': 'tbd',
    });
  });

  describe('rejects corrupted documents', () => {
    it('total over 1B', () => {
      const bad = mutate(good, (d) => {
        d.allocations[0].tokens = '150000001';
        d.allocations[0].baseUnits = '150000001000000000';
      });
      assert.match(errorsOf(bad), /over total supply|does not exactly correspond/);
    });

    it('total under 1B', () => {
      const bad = mutate(good, (d) => {
        d.allocations.pop();
      });
      const msg = errorsOf(bad);
      assert.match(msg, /under total supply by 50000000000000000/);
      assert.match(msg, /percentages total 95\.00%/);
    });

    it('percentages that do not match quantities', () => {
      const bad = mutate(good, (d) => {
        d.allocations[1].percent = '21';
      });
      assert.match(errorsOf(bad), /percent 21% does not exactly correspond/);
    });

    it('negative allocation', () => {
      const bad = mutate(good, (d) => {
        d.allocations[1].tokens = '-200000000';
        d.allocations[1].baseUnits = '-200000000000000000';
        d.allocations[1].percent = '-20';
      });
      assert.match(errorsOf(bad), /negatives are rejected/);
    });

    it('numbers instead of strings (float risk)', () => {
      const bad = mutate(good, (d) => {
        d.allocations[1].tokens = 200000000;
      });
      assert.match(errorsOf(bad), /decimal string \(numbers are not allowed\)/);
    });

    it('duplicate allocation ids and wallet roles', () => {
      const bad = mutate(good, (d) => {
        d.allocations[1].id = d.allocations[0].id;
        d.allocations[2].walletRole.role = d.allocations[3].walletRole.role;
      });
      const msg = errorsOf(bad);
      assert.match(msg, /duplicate allocation id "founder-team"/);
      assert.match(msg, /duplicate wallet role/);
    });

    for (const decimals of [-1, 10, 1.5, '9', null]) {
      it(`invalid decimals ${JSON.stringify(decimals)}`, () => {
        const bad = mutate(good, (d) => {
          d.token.decimals = decimals;
        });
        assert.match(errorsOf(bad), /decimals must be an integer between 0 and 9/);
      });
    }

    it('valid but unapproved decimals', () => {
      const bad = mutate(good, (d) => {
        d.token.decimals = 6;
      });
      assert.match(errorsOf(bad), /decimals must be 9/);
    });

    it('total supply that does not match decimals', () => {
      const bad = mutate(good, (d) => {
        d.token.totalSupplyBaseUnits = '1000000000000000001';
      });
      assert.match(errorsOf(bad), /totalSupplyBaseUnits must equal/);
    });

    it('Token-2022 program, mutable supply, freeze authority', () => {
      const bad = mutate(good, (d) => {
        d.token.tokenProgram = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
        d.token.supplyPolicy.fixedSupply = false;
        d.token.supplyPolicy.mintAuthority = 'keep';
        d.token.supplyPolicy.freezeAuthority = 'multisig';
      });
      const msg = errorsOf(bad);
      assert.match(msg, /classic SPL Token program/);
      assert.match(msg, /fixedSupply must be true/);
      assert.match(msg, /mintAuthority must be "revoke-permanently"/);
      assert.match(msg, /freezeAuthority must be "none"/);
    });

    it('a wallet address committed in Phase 1', () => {
      const bad = mutate(good, (d) => {
        d.allocations[0].walletRole.address = 'SomeAddress';
      });
      assert.match(errorsOf(bad), /address must be null in Phase 1/);
    });

    it('unknown fields', () => {
      const bad = mutate(good, (d) => {
        d.allocations[0].bonus = '1';
      });
      assert.match(errorsOf(bad), /bonus is not an allowed field/);
    });

    it('vesting that does not release the whole allocation', () => {
      const bad = mutate(good, (d) => {
        d.allocations[0].vesting.cliffMonths = 500;
      });
      assert.match(errorsOf(bad), /cliffMonths must be an integer/);
    });

    it('TGE release above 100%', () => {
      const bad = mutate(good, (d) => {
        d.allocations[0].vesting.tgeUnlockPercent = '101';
      });
      assert.match(errorsOf(bad), /tgeUnlockPercent must be a percent string/);
    });

    it('"approved" circulation while schedules are still TBD', () => {
      const bad = mutate(good, (d) => {
        d.circulation.status = 'approved';
      });
      assert.match(errorsOf(bad), /"approved" but schedules are TBD for: treasury/);
    });

    it('an invented schedule for a TBD allocation without approval status', () => {
      const bad = mutate(good, (d) => {
        d.allocations[1].vesting = {
          type: 'unspecified',
          status: 'approved',
          tgeUnlockPercent: '10',
        };
      });
      const msg = errorsOf(bad);
      assert.match(msg, /TBD schedule must have tgeUnlockPercent null/);
      assert.match(msg, /status must be "tbd"/);
    });

    it('a cliff-linear schedule marked TBD, or with a different release shape', () => {
      const bad = mutate(good, (d) => {
        d.allocations[0].vesting.status = 'tbd';
        d.allocations[0].vesting.releaseShape = 'lump-sum-at-cliff';
        d.allocations[0].vesting.monthCounting = 'thirty-day-months';
      });
      const msg = errorsOf(bad);
      assert.match(msg, /status must be "approved"/);
      assert.match(msg, /releaseShape must be/);
      assert.match(msg, /monthCounting must be/);
    });

    it('enforcement recorded as decided without a verified provider', () => {
      const bad = mutate(good, (d) => {
        d.enforcement.status = 'decided';
      });
      assert.match(errorsOf(bad), /enforcement.status must be "open"/);
    });

    it('missing circulation or enforcement blocks', () => {
      for (const key of ['circulation', 'enforcement']) {
        const bad = mutate(good, (d) => {
          delete d[key];
        });
        assert.match(errorsOf(bad), new RegExp(`${key} is missing`));
      }
    });

    it('non-object input', () => {
      for (const junk of [null, 5, 'x', [], undefined])
        assert.equal(validateAllocationDocument(junk).ok, false);
    });
  });

  it('parseAllocationDocument throws on invalid input', () => {
    assert.throws(
      () => parseAllocationDocument(mutate(good, (d) => (d.token.decimals = 12))),
      /allocation document is invalid/,
    );
  });
});

describe('integer helpers', () => {
  it('parseUint is strict', () => {
    assert.equal(parseUint('0'), 0n);
    assert.equal(parseUint('123'), 123n);
    for (const bad of ['', '01', '-1', '1.0', '1e9', ' 1', '0x10', 5, null])
      assert.equal(parseUint(bad), undefined);
  });

  it('parsePercentToBps is exact', () => {
    assert.equal(parsePercentToBps('15'), 1500n);
    assert.equal(parsePercentToBps('12.5'), 1250n);
    assert.equal(parsePercentToBps('0.01'), 1n);
    assert.equal(parsePercentToBps('100'), 10000n);
    for (const bad of ['-1', '1.234', '.5', '5.', '1e2', 15])
      assert.equal(parsePercentToBps(bad), undefined);
  });

  it('formats base units without floating point', () => {
    assert.equal(formatBaseUnits(1_500_000_000n, 9), '1.5');
    assert.equal(formatBaseUnits(10n ** 18n, 9), '1,000,000,000');
    assert.equal(formatBaseUnits(1n, 9), '0.000000001');
    assert.equal(tokensToBaseUnits(3n, 9), 3_000_000_000n);
  });
});
