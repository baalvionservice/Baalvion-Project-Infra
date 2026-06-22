/**
 * @file server/treasury/fees/fee-math.ts
 * @description Pure fee calculation — flat, percentage (basis points) and
 * tiered schedules, with optional min/max clamping. Exact BigInt math via
 * money-math; no floating point. The fee service turns the result into a
 * balanced ledger posting.
 */
import { Money } from '../../ledger/money';
import { bpsOf } from '../money-math';
import { FeeRuleDefinition, FeeTier } from '../types';

export class FeeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeeError';
  }
}

/** Select the tier whose upper bound first covers the base amount. */
function selectTier(tiers: FeeTier[], base: Money): FeeTier {
  const sorted = [...tiers].sort((a, b) => {
    if (a.upToAmount === null) return 1;
    if (b.upToAmount === null) return -1;
    return Money.of(a.upToAmount, base.currency).compare(Money.of(b.upToAmount, base.currency));
  });
  for (const tier of sorted) {
    if (tier.upToAmount === null) return tier;
    if (base.lte(Money.of(tier.upToAmount, base.currency))) return tier;
  }
  throw new FeeError('NO_TIER_MATCH: base amount exceeds all tier bounds and no open top band exists');
}

/**
 * Compute the fee for a base amount under a rule. The fee is denominated in the
 * rule's currency, which must match the base amount's currency.
 */
export function computeFee(rule: FeeRuleDefinition, base: Money): Money {
  if (base.isNegative()) throw new FeeError('NEGATIVE_BASE: fee base must be non-negative');
  if (rule.currency !== base.currency) {
    throw new FeeError(`FEE_CURRENCY_MISMATCH: rule ${rule.currency} vs base ${base.currency}`);
  }

  let fee: Money;
  switch (rule.type) {
    case 'FLAT':
      if (rule.flatAmount == null) throw new FeeError('FLAT fee requires flatAmount');
      fee = Money.of(rule.flatAmount, rule.currency);
      break;
    case 'PERCENTAGE':
      if (rule.basisPoints == null) throw new FeeError('PERCENTAGE fee requires basisPoints');
      fee = bpsOf(base, rule.basisPoints);
      break;
    case 'TIER': {
      if (!rule.tiers || rule.tiers.length === 0) throw new FeeError('TIER fee requires tiers');
      const tier = selectTier(rule.tiers, base);
      if (tier.flatAmount != null) fee = Money.of(tier.flatAmount, rule.currency);
      else if (tier.basisPoints != null) fee = bpsOf(base, tier.basisPoints);
      else throw new FeeError('tier must define basisPoints or flatAmount');
      break;
    }
    default:
      throw new FeeError(`UNKNOWN_FEE_TYPE: ${String(rule.type)}`);
  }

  if (rule.minFee != null) {
    const min = Money.of(rule.minFee, rule.currency);
    if (fee.lt(min)) fee = min;
  }
  if (rule.maxFee != null) {
    const max = Money.of(rule.maxFee, rule.currency);
    if (fee.gt(max)) fee = max;
  }
  return fee;
}
