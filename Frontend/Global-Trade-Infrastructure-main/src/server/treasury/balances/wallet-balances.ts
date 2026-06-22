/**
 * @file server/treasury/balances/wallet-balances.ts
 * @description Pure derivation of a wallet's full balance view from its four
 * bucket balances and its pending flows. This is the ONLY place wallet balances
 * are computed; the inputs come straight from immutable ledger account balances
 * and entry sums, so a wallet never has a balance of record — only a derivation.
 */
import { Money } from '../../ledger/money';
import { BucketBalances, WalletBalances, WalletFlows } from '../types';

export class BalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BalanceError';
  }
}

function assertSameCurrency(values: Money[]): string {
  const currency = values[0].currency;
  for (const v of values) {
    if (v.currency !== currency) {
      throw new BalanceError(`CURRENCY_MISMATCH: mixed ${currency} and ${v.currency} in one wallet`);
    }
  }
  return currency;
}

/**
 * Derive the full wallet balance view. Identities maintained:
 *   total     = available + held + reserved + pending
 *   projected = available + pending
 *   pending   = incoming − outgoing   (net of the PENDING bucket flows)
 */
export function deriveWalletBalances(buckets: BucketBalances, flows: WalletFlows): WalletBalances {
  const currency = assertSameCurrency([
    buckets.available,
    buckets.held,
    buckets.reserved,
    buckets.pending,
    flows.incoming,
    flows.outgoing,
  ]);

  const total = buckets.available.add(buckets.held).add(buckets.reserved).add(buckets.pending);
  const projected = buckets.available.add(buckets.pending);

  // Consistency backstop: the PENDING bucket must equal incoming − outgoing.
  const netPending = flows.incoming.subtract(flows.outgoing);
  if (!netPending.equals(buckets.pending)) {
    throw new BalanceError(
      `PENDING_FLOW_MISMATCH: bucket ${buckets.pending.toDecimalString()} ≠ in−out ${netPending.toDecimalString()} ${currency}`,
    );
  }

  return {
    currency,
    available: buckets.available,
    held: buckets.held,
    reserved: buckets.reserved,
    pending: buckets.pending,
    incoming: flows.incoming,
    outgoing: flows.outgoing,
    total,
    projected,
  };
}

/** Serialise a balance view to decimal strings (for API responses / projections). */
export function balancesToStrings(b: WalletBalances): Record<string, string> {
  return {
    currency: b.currency,
    available: b.available.toDecimalString(),
    held: b.held.toDecimalString(),
    reserved: b.reserved.toDecimalString(),
    pending: b.pending.toDecimalString(),
    incoming: b.incoming.toDecimalString(),
    outgoing: b.outgoing.toDecimalString(),
    total: b.total.toDecimalString(),
    projected: b.projected.toDecimalString(),
  };
}
