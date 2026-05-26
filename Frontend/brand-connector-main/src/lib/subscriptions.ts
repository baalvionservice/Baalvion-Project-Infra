"use client";

/**
 * @fileOverview Baalvion Subscription Billing Service
 *
 * Manages plan tiers, quotas, and payment state synchronization for brands.
 * Includes mock Stripe webhook simulations for prototype fidelity.
 */

import {
  doc,
  updateDoc,
  getDoc,
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { BrandProfile, SubscriptionStatus } from "@/types";

export type PlanType = "STARTER" | "GROWTH" | "ENTERPRISE";

export interface PlanLimit {
  maxCampaigns: number;
  maxTeamMembers: number;
  commission: number;
  supportLevel: string;
  monthlyPrice: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimit> = {
  STARTER: {
    maxCampaigns: 1,
    maxTeamMembers: 1,
    commission: 5,
    supportLevel: "Standard",
    monthlyPrice: 0,
  },
  GROWTH: {
    maxCampaigns: 5,
    maxTeamMembers: 3,
    commission: 3,
    supportLevel: "Priority",
    monthlyPrice: 9999,
  },
  ENTERPRISE: {
    maxCampaigns: 100,
    maxTeamMembers: 10,
    commission: 2,
    supportLevel: "Dedicated",
    monthlyPrice: 49999,
  },
};

/**
 * Initiates a plan subscription or upgrade.
 */
export async function subscribeToPlan(
  db: Firestore,
  brandId: string,
  plan: PlanType,
) {
  const brandRef = doc(db!, "brands", brandId);

  const updateData = {
    plan,
    subscriptionStatus: "ACTIVE" as SubscriptionStatus,
    currentPeriodEnd: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    cancelAtPeriodEnd: false,
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1. Update Brand Document
    await updateDoc(brandRef, updateData);

    // 2. Simulate Success Webhook
    await handleMockWebhook(db!, brandId, "payment_succeeded", {
      plan,
      amount: PLAN_LIMITS[plan].monthlyPrice,
    });

    return true;
  } catch (err: any) {
    errorEmitter.emitPermissionError(
      new FirestorePermissionError({
        path: brandRef.path,
        operation: "update",
        requestResourceData: updateData,
      }),
    );
    throw err;
  }
}

/**
 * Schedules a subscription cancellation at the end of the period.
 */
export async function cancelSubscription(db: Firestore, brandId: string) {
  const brandRef = doc(db!, "brands", brandId);
  const updateData = {
    cancelAtPeriodEnd: true,
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(brandRef, updateData);

    // 3. Simulate Cancellation Webhook
    await handleMockWebhook(db!, brandId, "subscription_cancelled", {});

    return true;
  } catch (err: any) {
    errorEmitter.emitPermissionError(
      new FirestorePermissionError({
        path: brandRef.path,
        operation: "update",
        requestResourceData: updateData,
      }),
    );
    throw err;
  }
}

/**
 * Validates if a brand is within their plan's campaign limits.
 */
export async function checkPlanLimits(db: Firestore, brandId: string) {
  const brandSnap = await getDoc(doc(db!, "brands", brandId));
  if (!brandSnap.exists())
    return { allowed: false, reason: "Profile not found" };

  const brand = brandSnap.data() as BrandProfile;
  const limits = PLAN_LIMITS[brand.plan];

  const campaignsQuery = query(
    collection(db!, "campaigns"),
    where("brandId", "==", brandId),
    where("status", "==", "ACTIVE"),
  );

  const activeCampaigns = await getDocs(campaignsQuery);

  if (activeCampaigns.size >= limits.maxCampaigns) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${limits.maxCampaigns} active campaigns for the ${brand.plan} plan.`,
      current: activeCampaigns.size,
      limit: limits.maxCampaigns,
    };
  }

  return { allowed: true };
}

/**
 * Mock Webhook Handler for Platform Fidelity
 */
async function handleMockWebhook(
  db: Firestore,
  brandId: string,
  event: "payment_succeeded" | "payment_failed" | "subscription_cancelled",
  metadata: any,
) {
  const auditRef = collection(db!, "audit_logs");
  const notificationRef = collection(db!, "notifications");

  // 1. Log System Event
  await addDoc(auditRef, {
    adminId: "STRIPE_WEBHOOK_SIM",
    adminName: "Payment Gateway",
    actionType: event.toUpperCase(),
    entityId: brandId,
    entityType: "BRAND",
    timestamp: new Date().toISOString(),
    isCritical: event === "payment_failed",
    newValue: metadata,
  });

  // 2. Dispatch User Notification
  let nTitle = "";
  let nMessage = "";

  if (event === "payment_succeeded") {
    nTitle = "Subscription Renewed! 💎";
    nMessage = `Your ${metadata.plan} plan payment of ₹${metadata.amount.toLocaleString()} was successful.`;
  } else if (event === "payment_failed") {
    nTitle = "Payment Declined ⚠️";
    nMessage =
      "We were unable to process your subscription renewal. Please update your payment method.";
  } else if (event === "subscription_cancelled") {
    nTitle = "Subscription Update";
    nMessage =
      "Your plan cancellation has been scheduled for the end of this billing period.";
  }

  await addDoc(notificationRef, {
    userId: brandId.replace("brand_", ""),
    title: nTitle,
    message: nMessage,
    type: "PAYMENT",
    read: false,
    createdAt: new Date().toISOString(),
    link: "/dashboard/brand/billing",
  });
}
