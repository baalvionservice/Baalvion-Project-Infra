/**
 * @file server/ledger/__tests__/posting.test.ts
 * @description Unit tests for the double-entry posting validator. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../money';
import { buildPosting, deltasFor, transfer, PostingError } from '../posting';
import { NormalSide, PostingLine } from '../types';

const usd = (v: string) => Money.of(v, 'USD');

describe('buildPosting — the balance invariant', () => {
  it('accepts a balanced two-leg transfer', () => {
    const posting = buildPosting(transfer('acc-A', 'acc-B', usd('100.00')));
    expect(posting.total.toDecimalString()).toBe('100.0000');
    expect(posting.currency).toBe('USD');
    expect(posting.lines).toHaveLength(2);
  });

  it('accepts a balanced multi-leg split (1 debit, 2 credits)', () => {
    const lines: PostingLine[] = [
      { accountId: 'buyer', direction: 'DEBIT', amount: usd('100.00') },
      { accountId: 'seller', direction: 'CREDIT', amount: usd('97.50') },
      { accountId: 'platform-fee', direction: 'CREDIT', amount: usd('2.50') },
    ];
    expect(() => buildPosting(lines)).not.toThrow();
  });

  it('rejects an unbalanced posting', () => {
    const lines: PostingLine[] = [
      { accountId: 'a', direction: 'DEBIT', amount: usd('100.00') },
      { accountId: 'b', direction: 'CREDIT', amount: usd('99.99') },
    ];
    expect(() => buildPosting(lines)).toThrow(PostingError);
  });

  it('rejects non-positive and mixed-currency legs', () => {
    expect(() =>
      buildPosting([
        { accountId: 'a', direction: 'DEBIT', amount: usd('0') },
        { accountId: 'b', direction: 'CREDIT', amount: usd('0') },
      ]),
    ).toThrow(/NON_POSITIVE/);

    expect(() =>
      buildPosting([
        { accountId: 'a', direction: 'DEBIT', amount: usd('10') },
        { accountId: 'b', direction: 'CREDIT', amount: Money.of('10', 'EUR') },
      ]),
    ).toThrow(/MIXED_CURRENCY/);
  });

  it('rejects single-leg postings and self-offsets', () => {
    expect(() => buildPosting([{ accountId: 'a', direction: 'DEBIT', amount: usd('10') }])).toThrow(/UNBALANCED/);
    expect(() =>
      buildPosting([
        { accountId: 'same', direction: 'DEBIT', amount: usd('10') },
        { accountId: 'same', direction: 'CREDIT', amount: usd('10') },
      ]),
    ).toThrow(/SELF_OFFSET/);
    expect(() => transfer('x', 'x', usd('10'))).toThrow(/SELF_TRANSFER/);
  });
});

describe('deltasFor — per-account normal-side balance effect', () => {
  const normalSide = (id: string): NormalSide => (id === 'liability' ? 'CREDIT' : 'DEBIT');

  it('moves an asset → asset transfer in opposite directions', () => {
    const posting = buildPosting(transfer('asset-src', 'asset-dst', usd('40.00')));
    const deltas = deltasFor(posting, normalSide);
    const dst = deltas.find((d) => d.accountId === 'asset-dst');
    const src = deltas.find((d) => d.accountId === 'asset-src');
    expect(dst?.delta.toDecimalString()).toBe('40.0000'); // debit increases an asset
    expect(src?.delta.toDecimalString()).toBe('-40.0000'); // credit decreases an asset
  });

  it('increases a credit-normal account when credited', () => {
    const posting = buildPosting([
      { accountId: 'asset', direction: 'DEBIT', amount: usd('25.00') },
      { accountId: 'liability', direction: 'CREDIT', amount: usd('25.00') },
    ]);
    const deltas = deltasFor(posting, normalSide);
    expect(deltas.find((d) => d.accountId === 'liability')?.delta.toDecimalString()).toBe('25.0000');
    expect(deltas.find((d) => d.accountId === 'asset')?.delta.toDecimalString()).toBe('25.0000');
  });
});
