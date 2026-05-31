/**
 * @fileOverview SubscriptionService
 * Orchestrates professional standing upgrades and plan management.
 * Backed by law-service (/v1/subscriptions): plans are public; the member's active
 * subscription + sign-up/cancel are auth-scoped to the logged-in user.
 */

import { apiClient } from "@/lib/api/client";
import { Subscription, Plan } from "@/types/subscription";

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

// law-service subscription row (snake_case) → app Subscription shape.
function mapSubscription(row: any, userId: string): Subscription {
  return {
    userId: String(row.user_id ?? userId ?? ""),
    planId: String(row.tier ?? row.planId ?? ""),
    active: (row.status ? row.status === "active" : !!row.active),
    startDate: row.started_at ? new Date(row.started_at).getTime() : (row.startDate ?? Date.now()),
    expiryDate: row.expires_at ? new Date(row.expires_at).getTime() : (row.expiryDate ?? 0),
  };
}

/**
 * Retrieves all available professional tiers (public plan catalog).
 */
export const getPlans = async (): Promise<Plan[]> => {
  const { data } = await apiClient.get("/subscriptions/plans");
  return unwrap<Plan[]>(data) ?? [];
};

/**
 * Retrieves the active subscription dossier for the authenticated member
 * (userId is server-scoped via the token).
 */
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  const { data } = await apiClient.get("/subscriptions");
  const row = unwrap<any>(data);
  return row ? mapSubscription(row, userId) : null;
};

/**
 * Commits a new professional standing upgrade. planId is the tier id
 * (BASIC | PROFESSIONAL | ENTERPRISE).
 */
export const subscribeUser = async (
  _userId: string,
  planId: string
): Promise<void> => {
  await apiClient.post("/subscriptions", { tier: String(planId).toUpperCase() });
};

/**
 * Cancels the authenticated member's active subscription.
 */
export const cancelSubscription = async (): Promise<void> => {
  await apiClient.post("/subscriptions/cancel");
};
