import { SubscriptionTier } from '@/types/premium';

/**
 * @fileOverview Marketing copy (description/features/highlight/color) for each subscription
 * tier, keyed by the backend's `plans.tier_key`. Deliberately static — this is presentational
 * content, not financial data, so unlike price it carries no risk of drifting out of sync with
 * what a customer is actually charged. Real price/name come from GET /payments/plans (the same
 * `plans` DB rows POST /payments/checkout charges from) — see premium-service.ts.
 */
export type TierPresentation = Pick<SubscriptionTier, 'description' | 'features' | 'isPopular' | 'color'>;

export const TIER_PRESENTATION: Record<string, TierPresentation> = {
  'tier-free': {
    description: 'Foundational access for retail learners.',
    features: ['Access to basic content', 'Limited calculators'],
    color: 'primary',
  },
  'tier-pro': {
    description: 'The definitive suite for serious analysts.',
    features: ['Full content access', 'Advanced calculators', 'AI portfolio insights'],
    isPopular: true,
    color: 'secondary',
  },
  'tier-enterprise': {
    description: 'Institutional-grade research infrastructure.',
    features: ['Team accounts', 'API access', 'Custom reports'],
    color: 'emerald',
  },
};

export const DEFAULT_TIER_PRESENTATION: TierPresentation = {
  description: 'Plan details',
  features: [],
  color: 'primary',
};
