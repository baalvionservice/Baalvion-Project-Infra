
export type PlanTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface PricingPlan {
  id: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  commission: number;
  features: string[];
  limits: {
    maxCampaigns: number;
    maxTeamMembers: number;
    aiMatching: boolean;
    advancedAnalytics: boolean;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  createdAt: string;
  pdfUrl?: string;
}
