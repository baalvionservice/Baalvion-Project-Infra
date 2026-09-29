/**
 * @fileOverview Subscription tier catalog (pricing config, not user data --
 * see subscriptionService.ts for the real create/get/cancel calls).
 *
 * `features` intentionally lists nothing: none of these tiers gate any real
 * capability today (verified against law-service -- no AI/matching/vault-quota/
 * analytics code exists, and createSubscription doesn't take a payment or
 * enforce a feature flag). Naming specific benefits here without any of them
 * being real is exactly the fabrication this codebase's content-integrity
 * rule exists to prevent. Add a feature string only once the corresponding
 * capability is actually built and tier-gated server-side.
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export const CLIENT_PLANS: Plan[] = [
  { id: 'basic', name: 'Basic', price: 0, features: [] },
  { id: 'premium', name: 'Premium', price: 999, features: [], recommended: true },
  { id: 'elite', name: 'Elite', price: 2499, features: [] },
];

export const LAWYER_PLANS: Plan[] = [
  { id: 'basic', name: 'Basic', price: 0, features: [] },
  { id: 'pro', name: 'Professional', price: 2999, features: [], recommended: true },
  { id: 'elite', name: 'Elite', price: 7999, features: [] },
];
