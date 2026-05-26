'use client';

import { Subscription, UserRole } from "../content/schemas";
import { authService } from "./auth.service";

let subscriptionsState: Subscription[] = [
  { id: 'sub-1', role: 'P1Investor', email: 'alex@investor.com', preferences: { News: true, Governance: true, Voting: true, DataRoom: true }, active: true },
  { id: 'sub-2', role: 'P2Investor', email: 'contact@acme-cap.com', preferences: { News: true, Governance: true, Voting: true, DataRoom: true }, active: true },
  { id: 'sub-3', role: 'P3Operator', email: 'elena.p@logistics.ai', preferences: { News: true, Governance: true, Voting: false, DataRoom: true }, active: true },
  { id: 'sub-4', role: 'BoardMember', email: 'gregg.l@board.com', preferences: { News: true, Governance: true, Voting: true, DataRoom: true }, active: true },
  { id: 'sub-5', role: 'P1Investor', email: 'jane.smith@fund.com', preferences: { News: false, Governance: true, Voting: true, DataRoom: false }, active: true },
];

export const subscriptionService = {
  getSubscribers: async (): Promise<Subscription[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...subscriptionsState];
  },

  getSubscriptionByRole: async (role: UserRole): Promise<Subscription | null> => {
    return subscriptionsState.find(s => s.role === role) || null;
  },

  updatePreferences: async (id: string, preferences: Subscription['preferences']): Promise<void> => {
    const sub = subscriptionsState.find(s => s.id === id);
    if (!sub) return;
    await new Promise(resolve => setTimeout(resolve, 200));
    sub.preferences = preferences;
    window.dispatchEvent(new Event('subscription-updated'));
  },

  toggleActive: async (id: string): Promise<void> => {
    const sub = subscriptionsState.find(s => s.id === id);
    if (!sub) return;
    sub.active = !sub.active;
    window.dispatchEvent(new Event('subscription-updated'));
  }
};
