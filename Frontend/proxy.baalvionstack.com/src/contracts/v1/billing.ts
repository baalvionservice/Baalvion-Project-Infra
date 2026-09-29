/**
 * Billing Contracts v1
 * Plan, Feature, Invoice, and Billing State types
 * 
 * STATE OWNERSHIP: PlanState
 */

import { BaseEntity, UUID, Timestamp, TenantScoped, AuditMeta } from "./base";

// ============================================
// BILLING STATE MACHINE
// ============================================

export type BillingState = 
  | "trial"        // Initial trial period
  | "active"       // Paid and current
  | "grace"        // Payment failed, grace period
  | "suspended"    // Access restricted
  | "cancelled";   // Subscription ended

export interface BillingStateTransition {
  from: BillingState;
  to: BillingState;
  trigger: BillingTrigger;
  timestamp: Timestamp;
}

export type BillingTrigger = 
  | "trial_started"
  | "trial_ended"
  | "payment_succeeded"
  | "payment_failed"
  | "grace_period_ended"
  | "plan_cancelled"
  | "plan_reactivated"
  | "admin_override";

// ============================================
// PLAN
// ============================================

export interface Plan extends BaseEntity {
  name: string;
  slug: PlanSlug;
  description: string;
  tier: PlanTier;
  pricing: PlanPricing;
  limits: PlanLimits;
  features: FeatureFlag[];
  trialDays: number;
  isPublic: boolean;
  metadata: Record<string, unknown>;
}

export type PlanSlug = "free" | "starter" | "pro" | "enterprise" | "custom";
export type PlanTier = 1 | 2 | 3 | 4 | 5;

export interface PlanPricing {
  basePrice: number;
  currency: string;
  interval: "monthly" | "yearly";
  overageRate?: number; // per GB
}

export interface PlanLimits {
  bandwidth: number;       // in MB, -1 for unlimited
  requests: number;        // per month, -1 for unlimited
  proxies: number;         // concurrent, -1 for unlimited
  subUsers: number;        // -1 for unlimited
  apiKeys: number;         // -1 for unlimited
  presets: number;         // -1 for unlimited
  sessionDuration: number; // max sticky session in minutes
  countries: number;       // -1 for all
}

// ============================================
// FEATURE FLAGS
// ============================================

export type FeatureFlag = 
  // Proxy features
  | "feature:residential"
  | "feature:mobile"
  | "feature:datacenter"
  | "feature:dedicated_ips"
  | "feature:sticky_sessions"
  | "feature:rotating_sessions"
  // Platform features
  | "feature:sub_users"
  | "feature:api_access"
  | "feature:analytics"
  | "feature:advanced_analytics"
  | "feature:audit_logs"
  | "feature:custom_presets"
  // Support features
  | "feature:email_support"
  | "feature:priority_support"
  | "feature:dedicated_support"
  | "feature:sla"
  // Integration features
  | "feature:webhooks"
  | "feature:custom_integration"
  | "feature:sso"
  // Export features
  | "feature:export_csv"
  | "feature:export_json"
  | "feature:export_api";

// ============================================
// PLAN FEATURE MATRIX
// ============================================

export const PLAN_FEATURES: Record<PlanSlug, FeatureFlag[]> = {
  free: [
    "feature:residential",
    "feature:rotating_sessions",
    "feature:email_support",
  ],
  starter: [
    "feature:residential",
    "feature:rotating_sessions",
    "feature:sticky_sessions",
    "feature:sub_users",
    "feature:custom_presets",
    "feature:email_support",
    "feature:export_csv",
  ],
  pro: [
    "feature:residential",
    "feature:mobile",
    "feature:datacenter",
    "feature:rotating_sessions",
    "feature:sticky_sessions",
    "feature:sub_users",
    "feature:api_access",
    "feature:analytics",
    "feature:custom_presets",
    "feature:priority_support",
    "feature:export_csv",
    "feature:export_json",
    "feature:webhooks",
  ],
  enterprise: [
    "feature:residential",
    "feature:mobile",
    "feature:datacenter",
    "feature:dedicated_ips",
    "feature:rotating_sessions",
    "feature:sticky_sessions",
    "feature:sub_users",
    "feature:api_access",
    "feature:analytics",
    "feature:advanced_analytics",
    "feature:audit_logs",
    "feature:custom_presets",
    "feature:dedicated_support",
    "feature:sla",
    "feature:export_csv",
    "feature:export_json",
    "feature:export_api",
    "feature:webhooks",
    "feature:custom_integration",
    "feature:sso",
  ],
  custom: [], // Defined per customer
};

// ============================================
// SUBSCRIPTION
// ============================================

export interface Subscription extends BaseEntity, TenantScoped, AuditMeta {
  planId: UUID;
  planSlug: PlanSlug;
  status: SubscriptionStatus;
  billingState: BillingState;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  trialEnd?: Timestamp;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  paymentMethodId?: string;
  metadata: Record<string, unknown>;
}

export type SubscriptionStatus = 
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "unpaid";

// ============================================
// INVOICE
// ============================================

export interface Invoice extends BaseEntity, TenantScoped {
  number: string;
  subscriptionId: UUID;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  dueDate: Timestamp;
  paidAt?: Timestamp;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  pdfUrl?: string;
}

export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";

export interface InvoiceLineItem {
  id: UUID;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: "subscription" | "overage" | "one_time" | "credit";
}

// ============================================
// USAGE RECORD
// ============================================

export interface UsageRecord extends BaseEntity, TenantScoped {
  subscriptionId: UUID;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  metrics: UsageMetrics;
  limits: PlanLimits;
  percentages: UsagePercentages;
  overages: UsageOverages;
}

export interface UsageMetrics {
  bandwidthUsed: number;    // in MB
  requestsCount: number;
  successCount: number;
  errorCount: number;
  activeProxies: number;
  activeSubUsers: number;
  activeApiKeys: number;
  avgLatency: number;
}

export interface UsagePercentages {
  bandwidth: number;
  requests: number;
  proxies: number;
  subUsers: number;
}

export interface UsageOverages {
  bandwidth: number;
  requests: number;
  overageCost: number;
}

// ============================================
// USAGE WARNING LEVELS
// ============================================

export type UsageWarningLevel = "normal" | "warning" | "critical" | "exceeded";

export interface UsageThresholds {
  warning: number;   // 80%
  critical: number;  // 90%
  exceeded: number;  // 100%
}

export const DEFAULT_USAGE_THRESHOLDS: UsageThresholds = {
  warning: 80,
  critical: 90,
  exceeded: 100,
};
