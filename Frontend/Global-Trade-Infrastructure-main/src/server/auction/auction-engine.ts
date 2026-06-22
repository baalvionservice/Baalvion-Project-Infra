/**
 * @file server/auction/auction-engine.ts
 * @description Pure auction mechanics: eBay-style proxy bidding, anti-snipe
 * extension and reserve-gated winner selection. Every function here is a pure
 * total function of its inputs — no Prisma, no clock, no randomness — so the
 * money-critical rules can be exhaustively unit-tested in isolation. The service
 * layer feeds these decisions the current row state and persists the result.
 *
 * Money is always the ledger {@link Money} (scale-4 bigint) so price ladders are
 * penny-exact and never drift.
 */
import { Money } from '../ledger/money';

/** The pricing state of an auction at the moment a bid is evaluated. */
export interface AuctionPricingState {
  currency: string;
  startPrice: Money;
  bidIncrement: Money; // strictly positive
  reservePrice: Money | null;
  currentPrice: Money; // standing/visible price (zero before the first bid)
  bidCount: number;
  leaderActorId: string | null;
  leaderMaxProxy: Money | null; // hidden ceiling of the current leader
}

/** An incoming challenger bid. */
export interface ChallengerBid {
  bidderActorId: string;
  amount: Money; // the visible amount the bidder commits to
  maxProxyAmount: Money | null; // optional hidden ceiling (>= amount)
}

export type BidDecision = 'ACCEPTED' | 'REJECTED';
export type BidRejectReason = 'BID_TOO_LOW' | 'PROXY_BELOW_BID' | 'CURRENCY_MISMATCH';

/** The full outcome of evaluating one bid against the auction's pricing state. */
export interface BidOutcome {
  decision: BidDecision;
  reason: BidRejectReason | null;
  newPrice: Money; // standing price after applying this bid (unchanged on reject)
  newLeaderActorId: string | null;
  newLeaderMaxProxy: Money | null;
  outbidActorId: string | null; // who lost the lead (incumbent) OR the challenger when self-outbid
  leaderChanged: boolean;
  proxyRaise: boolean; // the price moved up the proxy ladder beyond the visible bid
  minNextBid: Money; // the minimum amount the next challenger must commit
}

/** The minimum amount a fresh challenger must commit to be considered. */
export function minimumNextBid(state: AuctionPricingState): Money {
  return state.bidCount === 0 ? state.startPrice : state.currentPrice.add(state.bidIncrement);
}

function lower(a: Money, b: Money): Money {
  return a.lte(b) ? a : b;
}

function reject(state: AuctionPricingState, reason: BidRejectReason): BidOutcome {
  return {
    decision: 'REJECTED',
    reason,
    newPrice: state.currentPrice,
    newLeaderActorId: state.leaderActorId,
    newLeaderMaxProxy: state.leaderMaxProxy,
    outbidActorId: null,
    leaderChanged: false,
    proxyRaise: false,
    minNextBid: minimumNextBid(state),
  };
}

/**
 * Resolve a challenger bid against the auction's pricing state using the classic
 * proxy (automatic) bidding model:
 *
 *  • The first valid bid lifts the price to the start price; the bidder's true
 *    ceiling stays hidden.
 *  • A challenger whose ceiling beats the incumbent's takes the lead at the
 *    smaller of (their ceiling) and (incumbent ceiling + one increment).
 *  • A challenger who cannot beat the incumbent is immediately outbid by the
 *    incumbent's proxy, which auto-raises the standing price.
 *  • The current leader may raise their own hidden ceiling without moving price.
 */
export function evaluateBid(state: AuctionPricingState, challenger: ChallengerBid): BidOutcome {
  if (challenger.amount.currency !== state.currency) return reject(state, 'CURRENCY_MISMATCH');

  const challengerMax = challenger.maxProxyAmount ?? challenger.amount;
  if (challengerMax.lt(challenger.amount)) return reject(state, 'PROXY_BELOW_BID');

  // The current leader is topping up their own hidden ceiling: price is unchanged.
  if (state.leaderActorId && challenger.bidderActorId === state.leaderActorId) {
    if (challengerMax.lt(state.currentPrice)) return reject(state, 'BID_TOO_LOW');
    const keptMax =
      state.leaderMaxProxy && state.leaderMaxProxy.gte(challengerMax) ? state.leaderMaxProxy : challengerMax;
    return {
      decision: 'ACCEPTED',
      reason: null,
      newPrice: state.currentPrice,
      newLeaderActorId: state.leaderActorId,
      newLeaderMaxProxy: keptMax,
      outbidActorId: null,
      leaderChanged: false,
      proxyRaise: false,
      minNextBid: state.currentPrice.add(state.bidIncrement),
    };
  }

  const minNext = minimumNextBid(state);
  if (challenger.amount.lt(minNext)) return reject(state, 'BID_TOO_LOW');

  // First bid on the lot: price settles at the start price, ceiling stays hidden.
  if (state.bidCount === 0 || !state.leaderActorId) {
    const price = state.startPrice;
    return {
      decision: 'ACCEPTED',
      reason: null,
      newPrice: price,
      newLeaderActorId: challenger.bidderActorId,
      newLeaderMaxProxy: challengerMax,
      outbidActorId: null,
      leaderChanged: true,
      proxyRaise: false,
      minNextBid: price.add(state.bidIncrement),
    };
  }

  const leaderMax = state.leaderMaxProxy ?? state.currentPrice;

  // Challenger out-ceilings the incumbent → takes the lead.
  if (challengerMax.gt(leaderMax)) {
    const newPrice = lower(challengerMax, leaderMax.add(state.bidIncrement));
    return {
      decision: 'ACCEPTED',
      reason: null,
      newPrice,
      newLeaderActorId: challenger.bidderActorId,
      newLeaderMaxProxy: challengerMax,
      outbidActorId: state.leaderActorId,
      leaderChanged: true,
      proxyRaise: newPrice.gt(challenger.amount),
      minNextBid: newPrice.add(state.bidIncrement),
    };
  }

  // Challenger cannot beat the incumbent → incumbent's proxy auto-raises and the
  // challenger is outbid the instant they bid.
  const newPrice = challengerMax.equals(leaderMax)
    ? challengerMax
    : lower(leaderMax, challengerMax.add(state.bidIncrement));
  return {
    decision: 'ACCEPTED',
    reason: null,
    newPrice,
    newLeaderActorId: state.leaderActorId,
    newLeaderMaxProxy: state.leaderMaxProxy,
    outbidActorId: challenger.bidderActorId,
    leaderChanged: false,
    proxyRaise: true,
    minNextBid: newPrice.add(state.bidIncrement),
  };
}

// ── Anti-sniping ─────────────────────────────────────────────────────────────

export interface AntiSnipeParams {
  endsAt: Date;
  bidAt: Date;
  antiSnipeSeconds: number; // how long to extend by
  antiSnipeThresholdSeconds: number; // a bid is "late" within this window of endsAt (0 => use antiSnipeSeconds)
}

export interface AntiSnipeResult {
  extended: boolean;
  newEndsAt: Date;
}

/**
 * Extend the close time when a bid lands inside the anti-snipe window, so a
 * last-second bid can never deny others a fair chance to respond. The end time
 * is only ever pushed later, never earlier.
 */
export function applyAntiSnipe(p: AntiSnipeParams): AntiSnipeResult {
  if (p.antiSnipeSeconds <= 0) return { extended: false, newEndsAt: p.endsAt };
  const thresholdSeconds = p.antiSnipeThresholdSeconds > 0 ? p.antiSnipeThresholdSeconds : p.antiSnipeSeconds;
  const msToEnd = p.endsAt.getTime() - p.bidAt.getTime();
  if (msToEnd < 0) return { extended: false, newEndsAt: p.endsAt }; // already past close
  if (msToEnd > thresholdSeconds * 1000) return { extended: false, newEndsAt: p.endsAt }; // not a late bid
  const candidate = new Date(p.bidAt.getTime() + p.antiSnipeSeconds * 1000);
  if (candidate.getTime() <= p.endsAt.getTime()) return { extended: false, newEndsAt: p.endsAt };
  return { extended: true, newEndsAt: candidate };
}

// ── Winner selection ─────────────────────────────────────────────────────────

export interface CloseState {
  currency: string;
  currentPrice: Money;
  reservePrice: Money | null;
  bidCount: number;
  leaderActorId: string | null;
  leaderBidId: string | null;
}

export type CloseOutcome = 'SETTLED' | 'FAILED';

export interface ClosePlan {
  outcome: CloseOutcome;
  winnerActorId: string | null;
  winnerBidId: string | null;
  winningAmount: Money | null;
  reason: string; // NO_BIDS | RESERVE_NOT_MET | WINNER_CONFIRMED
}

/**
 * Decide the close outcome: a sale to the standing leader, or a failed auction
 * when there were no bids or the hidden reserve was never met.
 */
export function planClose(s: CloseState): ClosePlan {
  if (s.bidCount === 0 || !s.leaderActorId) {
    return { outcome: 'FAILED', winnerActorId: null, winnerBidId: null, winningAmount: null, reason: 'NO_BIDS' };
  }
  if (s.reservePrice && s.currentPrice.lt(s.reservePrice)) {
    return { outcome: 'FAILED', winnerActorId: null, winnerBidId: null, winningAmount: null, reason: 'RESERVE_NOT_MET' };
  }
  return {
    outcome: 'SETTLED',
    winnerActorId: s.leaderActorId,
    winnerBidId: s.leaderBidId,
    winningAmount: s.currentPrice,
    reason: 'WINNER_CONFIRMED',
  };
}
