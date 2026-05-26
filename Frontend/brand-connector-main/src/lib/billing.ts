
import { PlanTier } from '@/types/billing';

export type Feature = 
  | 'AI_MATCHING' 
  | 'TEAM_MANAGEMENT' 
  | 'ADVANCED_ANALYTICS' 
  | 'API_ACCESS' 
  | 'CUSTOM_CONTRACTS';

/**
 * Validates if a specific plan tier has access to a platform feature.
 */
export function hasAccess(plan: PlanTier | string, feature: Feature): boolean {
  const p = plan.toUpperCase() as PlanTier;

  switch (feature) {
    case 'AI_MATCHING':
    case 'ADVANCED_ANALYTICS':
      return p === 'GROWTH' || p === 'ENTERPRISE';
    
    case 'TEAM_MANAGEMENT':
      return p === 'GROWTH' || p === 'ENTERPRISE';

    case 'API_ACCESS':
    case 'CUSTOM_CONTRACTS':
      return p === 'ENTERPRISE';

    default:
      return false;
  }
}

/**
 * Returns the maximum number of active campaigns allowed for a plan.
 */
export function getCampaignLimit(plan: PlanTier | string): number {
  const p = plan.toUpperCase() as PlanTier;
  if (p === 'ENTERPRISE') return 1000; // Effectively unlimited
  if (p === 'GROWTH') return 10;
  return 1; // Starter
}
