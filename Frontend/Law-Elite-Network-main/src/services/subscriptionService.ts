/**
 * @fileOverview SubscriptionService
 * Orchestrates professional standing upgrades and plan management.
 */

import {
  plans,
  getSubscriptionMock,
  saveSubscriptionMock,
} from "@/lib/mock/subscriptionMock";
import { Subscription, Plan } from "@/types/subscription";

/**
 * Retrieves all available professional tiers.
 */
export const getPlans = async (): Promise<Plan[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return plans;
};

/**
 * Retrieves the active subscription dossier for a specific member.
 */
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  const data = getSubscriptionMock();
  return data.find((s: Subscription) => s.userId === userId) || null;
};

/**
 * Commits a new professional standing upgrade to the network.
 */
export const subscribeUser = async (
  userId: string,
  planId: string
): Promise<void> => {
  // Simulate financial synchronization latency
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const data = getSubscriptionMock();
  const filtered = data.filter((s: Subscription) => s.userId !== userId);

  const startDate = Date.now();
  const expiryDate = startDate + (30 * 24 * 60 * 60 * 1000); // 30-day cycle

  filtered.push({
    userId,
    planId,
    active: true,
    startDate,
    expiryDate
  });

  saveSubscriptionMock(filtered);
};
