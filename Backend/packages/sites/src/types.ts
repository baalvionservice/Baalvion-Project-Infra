/**
 * A payment rail a site is permitted to charge on. This is a capability granted to a site,
 * never part of the site's identity — crypto on one property and Razorpay on another are the
 * same registry column with different values.
 */
export type PaymentRail =
  | 'razorpay'
  | 'payu'
  | 'stripe'
  | 'cashfree'
  | 'bank_transfer'
  | 'crypto';

export const PAYMENT_RAILS: readonly PaymentRail[] = Object.freeze([
  'razorpay', 'payu', 'stripe', 'cashfree', 'bank_transfer', 'crypto',
]);

export type SiteStatus =
  /** Serves real traffic today. */
  | 'live'
  /** Built, but the domain does not resolve or returns an error. */
  | 'not_live'
  /** Internal control plane — real sessions to audit, but not a revenue property. */
  | 'internal';

/**
 * How the `rails` list was established. A registry that will be audited needs to say which
 * entries a human confirmed and which were inferred from code, because only the first kind
 * may be trusted to authorise a charge.
 */
export type RailsBasis =
  /** Confirmed by the platform owner. */
  | 'confirmed'
  /** Inferred from a live integration in the service code; needs confirming. */
  | 'code'
  /** No rails configured. Charging is not permitted until someone sets them. */
  | 'none';

export interface Site {
  /** Stable identifier, carried on every money row, event and ledger line. Never reused. */
  readonly id: string;
  readonly name: string;
  /** Primary domain first. */
  readonly domains: readonly string[];
  /**
   * When true, any unmatched subdomain of the primary domain resolves to this site.
   * Off by default: a subdomain is usually a different product, not the same one.
   */
  readonly apexOwnsSubdomains: boolean;
  readonly status: SiteStatus;
  readonly rails: readonly PaymentRail[];
  readonly railsBasis: RailsBasis;
  /** Backend services that own this site's data. */
  readonly services: readonly string[];
  /**
   * Which legal entity collects money for this site. Null everywhere today — this is an
   * unanswered ownership decision, and the group chart of accounts cannot be designed
   * without it. Required before any ledger work.
   */
  readonly legalEntity: string | null;
}
