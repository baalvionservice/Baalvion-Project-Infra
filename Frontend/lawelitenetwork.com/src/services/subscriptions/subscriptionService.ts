/**
 * @fileOverview Subscription Service — LIVE (law-service subscriptions / Postgres).
 * Plan catalog (pricing tiers) is static config; the member's subscription is real data.
 * No Firebase, no mock user records.
 */
import { subscriptionApi } from '@/lib/api/client';
import { LAWYER_PLANS, CLIENT_PLANS } from './subscription.mock';

// Plan catalog = pricing configuration (not user data).
export const getPlansByRole = (role: string) => (role === 'lawyer' ? LAWYER_PLANS : CLIENT_PLANS);

// Map a plan id (e.g. "pro", "elite", "professional") to a backend tier.
const planToTier = (planId: string): 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' => {
  const p = String(planId).toLowerCase();
  if (/(enterprise|elite|premier|max)/.test(p)) return 'ENTERPRISE';
  if (/(pro|professional|plus|growth)/.test(p)) return 'PROFESSIONAL';
  return 'BASIC';
};

const adaptSub = (s: any) => {
  if (!s) return null;
  return {
    id: String(s.id),
    tier: s.tier,
    planId: String(s.tier || '').toLowerCase(),
    status: s.status,
    active: s.status === 'active',
    startDate: s.started_at,
    expiryDate: s.expires_at,
  };
};

export const createSubscription = async (_userId: string, planId: string, role = 'client') => {
  const subscriberType = role === 'lawyer' ? 'lawyer' : 'client';
  const res = await subscriptionApi.create({ tier: planToTier(planId), subscriberType });
  return adaptSub(res?.data?.data);
};

export const getUserSubscription = async (_userId?: string, role = 'client') => {
  try {
    const subscriberType = role === 'lawyer' ? 'lawyer' : 'client';
    const res = await subscriptionApi.get({ params: { subscriberType } });
    return adaptSub(res?.data?.data);
  } catch {
    return null;
  }
};

export const cancelSubscription = async (_userId?: string, role = 'client') => {
  const subscriberType = role === 'lawyer' ? 'lawyer' : 'client';
  await subscriptionApi.cancel(subscriberType);
  return { success: true };
};
