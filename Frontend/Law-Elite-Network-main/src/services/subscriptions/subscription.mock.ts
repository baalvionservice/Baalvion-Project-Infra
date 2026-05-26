/**
 * @fileOverview Mock Subscription Ledger
 * Simulates persistence for the network's premium tiers and professional standing.
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export const CLIENT_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: ['Standard Case Posting', 'Basic Lawyer Discovery', 'E2E Encrypted Chat']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 999,
    features: ['Priority Counsel Matching', 'AI Case Summaries', 'Advanced Document Auditing'],
    recommended: true
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 2499,
    features: ['Unlimited Vault Storage', '24/7 Priority Concierge', 'Predictive Strategy Insights']
  }
];

export const LAWYER_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    features: ['Public Listing', 'Standard Messaging', 'Chambers Dashboard']
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 2999,
    features: ['50% Discovery Boost', 'Advanced Analytics', 'Verified Pro Badge'],
    recommended: true
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 7999,
    features: ['Top-Tier Listing', 'Exclusive Lead Matching', 'Unlimited Performance Boost']
  }
];

const STORAGE_KEY = 'law_elite_subscription_ledger';

export const mockCreateSubscription = async (userId: string, planId: string) => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const startDate = Date.now();
  const expiryDate = startDate + (30 * 24 * 60 * 60 * 1000); // 30-day term

  const subscription = {
    userId,
    planId,
    status: 'active',
    startDate,
    expiryDate,
    autoRenew: true
  };

  localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(subscription));

  // Sync back to the mock user profile
  const userStr = localStorage.getItem('law_elite_user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.id === userId) {
      user.subscriptionTier = planId.toUpperCase();
      localStorage.setItem('law_elite_user', JSON.stringify(user));
    }
  }

  return subscription;
};

export const mockGetSubscription = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const data = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
  return data ? JSON.parse(data) : null;
};

export const mockCancelSubscription = async (userId: string) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const data = await mockGetSubscription(userId);
  if (data) {
    const updated = { ...data, status: 'cancelled', autoRenew: false };
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(updated));
    return updated;
  }
  return null;
};
