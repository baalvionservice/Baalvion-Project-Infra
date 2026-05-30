'use client';

import { Subscription, UserRole } from "../content/schemas";
import { subscriptionsApi } from "@/lib/ir-engagement";

// Live, backed by ir-service /api/v1/subscriptions. No in-memory mock.
export const subscriptionService = {
  getSubscribers: async (): Promise<Subscription[]> => {
    return (await subscriptionsApi.list()) as Subscription[];
  },

  getSubscriptionByRole: async (role: UserRole): Promise<Subscription | null> => {
    const subs = await subscriptionsApi.list();
    return (subs.find((s) => s.role === role) as Subscription) || null;
  },

  updatePreferences: async (id: string, preferences: Subscription['preferences']): Promise<void> => {
    await subscriptionsApi.update(id, { preferences });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('subscription-updated'));
  },

  toggleActive: async (id: string): Promise<void> => {
    const subs = await subscriptionsApi.list();
    const sub = subs.find((s) => s.id === id);
    if (!sub) return;
    await subscriptionsApi.update(id, { active: !sub.active });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('subscription-updated'));
  },
};
