/**
 * @file server/auction/__tests__/auction-engine.test.ts
 * @description Exhaustive unit tests for the pure auction mechanics: proxy
 * bidding, anti-snipe extension and reserve-gated winner selection. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../../ledger/money';
import {
  evaluateBid,
  applyAntiSnipe,
  planClose,
  minimumNextBid,
  type AuctionPricingState,
} from '../auction-engine';

const usd = (v: string) => Money.of(v, 'USD');

function state(overrides: Partial<AuctionPricingState> = {}): AuctionPricingState {
  return {
    currency: 'USD',
    startPrice: usd('10'),
    bidIncrement: usd('1'),
    reservePrice: null,
    currentPrice: usd('0'),
    bidCount: 0,
    leaderActorId: null,
    leaderMaxProxy: null,
    ...overrides,
  };
}

describe('minimumNextBid', () => {
  it('is the start price for the first bid', () => {
    expect(minimumNextBid(state()).toDecimalString()).toBe('10.0000');
  });

  it('is current price plus one increment after the first bid', () => {
    const s = state({ bidCount: 1, currentPrice: usd('25'), bidIncrement: usd('5') });
    expect(minimumNextBid(s).toDecimalString()).toBe('30.0000');
  });
});

describe('evaluateBid — first bid', () => {
  it('lifts the price to the start price and hides the ceiling', () => {
    // Arrange
    const s = state();
    // Act
    const out = evaluateBid(s, { bidderActorId: 'A', amount: usd('10'), maxProxyAmount: usd('50') });
    // Assert
    expect(out.decision).toBe('ACCEPTED');
    expect(out.newPrice.toDecimalString()).toBe('10.0000');
    expect(out.newLeaderActorId).toBe('A');
    expect(out.newLeaderMaxProxy?.toDecimalString()).toBe('50.0000');
    expect(out.leaderChanged).toBe(true);
    expect(out.outbidActorId).toBeNull();
  });

  it('rejects a first bid below the start price', () => {
    const out = evaluateBid(state(), { bidderActorId: 'A', amount: usd('5'), maxProxyAmount: null });
    expect(out.decision).toBe('REJECTED');
    expect(out.reason).toBe('BID_TOO_LOW');
  });
});

describe('evaluateBid — proxy bidding', () => {
  const incumbent = state({
    bidCount: 1,
    currentPrice: usd('10'),
    leaderActorId: 'A',
    leaderMaxProxy: usd('20'),
  });

  it('lets a higher ceiling take the lead at one increment over the incumbent', () => {
    // Act: B has a ceiling (30) above A's (20)
    const out = evaluateBid(incumbent, { bidderActorId: 'B', amount: usd('15'), maxProxyAmount: usd('30') });
    // Assert: price climbs to 20 + 1 increment = 21; B leads; A is outbid
    expect(out.decision).toBe('ACCEPTED');
    expect(out.newPrice.toDecimalString()).toBe('21.0000');
    expect(out.newLeaderActorId).toBe('B');
    expect(out.outbidActorId).toBe('A');
    expect(out.leaderChanged).toBe(true);
    expect(out.proxyRaise).toBe(true);
  });

  it('caps the winning price at the challenger ceiling when that is lower than incumbent+increment', () => {
    const s = state({ bidCount: 1, currentPrice: usd('10'), leaderActorId: 'A', leaderMaxProxy: usd('20'), bidIncrement: usd('5') });
    // B ceiling 22 beats A's 20, but 20+5=25 > 22 → price is capped at 22
    const out = evaluateBid(s, { bidderActorId: 'B', amount: usd('15'), maxProxyAmount: usd('22') });
    expect(out.newPrice.toDecimalString()).toBe('22.0000');
    expect(out.newLeaderActorId).toBe('B');
  });

  it('auto-raises the incumbent and outbids a challenger who cannot beat the ceiling', () => {
    const s = state({ bidCount: 1, currentPrice: usd('10'), leaderActorId: 'A', leaderMaxProxy: usd('50') });
    // B commits 15 with ceiling 20 (< A's 50): A's proxy auto-raises to 21, B outbid instantly
    const out = evaluateBid(s, { bidderActorId: 'B', amount: usd('15'), maxProxyAmount: usd('20') });
    expect(out.decision).toBe('ACCEPTED');
    expect(out.newPrice.toDecimalString()).toBe('21.0000');
    expect(out.newLeaderActorId).toBe('A');
    expect(out.outbidActorId).toBe('B');
    expect(out.leaderChanged).toBe(false);
    expect(out.proxyRaise).toBe(true);
  });

  it('keeps the incumbent on a tie of ceilings, settling the price at that ceiling', () => {
    const s = state({ bidCount: 1, currentPrice: usd('10'), leaderActorId: 'A', leaderMaxProxy: usd('50') });
    const out = evaluateBid(s, { bidderActorId: 'B', amount: usd('30'), maxProxyAmount: usd('50') });
    expect(out.newPrice.toDecimalString()).toBe('50.0000');
    expect(out.newLeaderActorId).toBe('A');
    expect(out.outbidActorId).toBe('B');
  });

  it('lets the current leader raise their own ceiling without moving the price', () => {
    const s = state({ bidCount: 1, currentPrice: usd('10'), leaderActorId: 'A', leaderMaxProxy: usd('20') });
    const out = evaluateBid(s, { bidderActorId: 'A', amount: usd('25'), maxProxyAmount: usd('40') });
    expect(out.decision).toBe('ACCEPTED');
    expect(out.newPrice.toDecimalString()).toBe('10.0000');
    expect(out.newLeaderActorId).toBe('A');
    expect(out.newLeaderMaxProxy?.toDecimalString()).toBe('40.0000');
    expect(out.leaderChanged).toBe(false);
    expect(out.outbidActorId).toBeNull();
  });

  it('rejects a non-leading bid below the minimum next bid', () => {
    const out = evaluateBid(incumbent, { bidderActorId: 'B', amount: usd('10'), maxProxyAmount: usd('40') });
    expect(out.decision).toBe('REJECTED');
    expect(out.reason).toBe('BID_TOO_LOW');
  });

  it('rejects a bid in the wrong currency', () => {
    const out = evaluateBid(incumbent, { bidderActorId: 'B', amount: Money.of('15', 'EUR'), maxProxyAmount: null });
    expect(out.decision).toBe('REJECTED');
    expect(out.reason).toBe('CURRENCY_MISMATCH');
  });
});

describe('applyAntiSnipe', () => {
  const end = new Date('2026-06-22T12:00:00.000Z');

  it('does nothing when anti-snipe is disabled', () => {
    const r = applyAntiSnipe({ endsAt: end, bidAt: new Date(end.getTime() - 1000), antiSnipeSeconds: 0, antiSnipeThresholdSeconds: 60 });
    expect(r.extended).toBe(false);
    expect(r.newEndsAt).toBe(end);
  });

  it('extends the close time for a late bid inside the threshold window', () => {
    const r = applyAntiSnipe({ endsAt: end, bidAt: new Date(end.getTime() - 10_000), antiSnipeSeconds: 30, antiSnipeThresholdSeconds: 60 });
    expect(r.extended).toBe(true);
    expect(r.newEndsAt.getTime()).toBe(end.getTime() + 20_000); // bidAt + 30s
  });

  it('falls back to the extension length as the window when no threshold is set', () => {
    const r = applyAntiSnipe({ endsAt: end, bidAt: new Date(end.getTime() - 10_000), antiSnipeSeconds: 30, antiSnipeThresholdSeconds: 0 });
    expect(r.extended).toBe(true);
  });

  it('does not extend for a bid outside the window', () => {
    const r = applyAntiSnipe({ endsAt: end, bidAt: new Date(end.getTime() - 120_000), antiSnipeSeconds: 30, antiSnipeThresholdSeconds: 60 });
    expect(r.extended).toBe(false);
  });

  it('never shortens the close time', () => {
    const r = applyAntiSnipe({ endsAt: end, bidAt: new Date(end.getTime() - 50_000), antiSnipeSeconds: 30, antiSnipeThresholdSeconds: 60 });
    expect(r.extended).toBe(false); // bidAt + 30s = end - 20s, earlier than end
  });

  it('does not extend a bid that arrives after close', () => {
    const r = applyAntiSnipe({ endsAt: end, bidAt: new Date(end.getTime() + 1000), antiSnipeSeconds: 30, antiSnipeThresholdSeconds: 60 });
    expect(r.extended).toBe(false);
  });
});

describe('planClose — winner selection', () => {
  it('fails when there were no bids', () => {
    const p = planClose({ currency: 'USD', currentPrice: usd('0'), reservePrice: null, bidCount: 0, leaderActorId: null, leaderBidId: null });
    expect(p.outcome).toBe('FAILED');
    expect(p.reason).toBe('NO_BIDS');
  });

  it('fails when the hidden reserve was never met', () => {
    const p = planClose({ currency: 'USD', currentPrice: usd('50'), reservePrice: usd('100'), bidCount: 3, leaderActorId: 'A', leaderBidId: 'bid-1' });
    expect(p.outcome).toBe('FAILED');
    expect(p.reason).toBe('RESERVE_NOT_MET');
    expect(p.winnerActorId).toBeNull();
  });

  it('confirms the standing leader as winner when the reserve is met', () => {
    const p = planClose({ currency: 'USD', currentPrice: usd('120'), reservePrice: usd('100'), bidCount: 4, leaderActorId: 'A', leaderBidId: 'bid-9' });
    expect(p.outcome).toBe('SETTLED');
    expect(p.winnerActorId).toBe('A');
    expect(p.winnerBidId).toBe('bid-9');
    expect(p.winningAmount?.toDecimalString()).toBe('120.0000');
  });

  it('confirms a winner when there is no reserve', () => {
    const p = planClose({ currency: 'USD', currentPrice: usd('15'), reservePrice: null, bidCount: 1, leaderActorId: 'B', leaderBidId: 'bid-2' });
    expect(p.outcome).toBe('SETTLED');
    expect(p.winnerActorId).toBe('B');
  });
});
