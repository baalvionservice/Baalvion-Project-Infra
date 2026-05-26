/**
 * Plan State
 * 
 * OWNERSHIP: Server is source of truth, client caches
 * SCOPE: Current organization's subscription
 * PERSISTENCE: localStorage cache, refresh on navigation
 * 
 * Contains billing state machine, plan limits, and feature access.
 */

import { UUID, Timestamp } from "@/contracts/v1/base";
import { 
  Plan, 
  PlanSlug, 
  Subscription, 
  BillingState, 
  FeatureFlag,
  PlanLimits,
  PLAN_FEATURES,
  UsageWarningLevel,
} from "@/contracts/v1/billing";

// ============================================
// PLAN STATE INTERFACE
// ============================================

export interface PlanState {
  // Current plan
  currentPlan: Plan | null;
  subscription: Subscription | null;
  
  // Billing state machine
  billingState: BillingState;
  
  // Available plans (for comparison)
  availablePlans: Plan[];
  
  // Feature access
  enabledFeatures: FeatureFlag[];
  
  // Limits
  limits: PlanLimits;
  
  // Trial info
  isTrialing: boolean;
  trialDaysRemaining: number;
  
  // Upgrade prompts
  showUpgradePrompt: boolean;
  upgradePromptReason: string | null;
  
  // Loading
  isLoading: boolean;
  lastFetchedAt: Timestamp | null;
}

// ============================================
// DEFAULT LIMITS (FREE TIER)
// ============================================

const defaultLimits: PlanLimits = {
  bandwidth: 1024,        // 1 GB
  requests: 10000,        // per month
  proxies: 10,
  subUsers: 0,
  apiKeys: 1,
  presets: 3,
  sessionDuration: 5,     // 5 min max
  countries: 5,
};

// ============================================
// INITIAL STATE
// ============================================

export const initialPlanState: PlanState = {
  currentPlan: null,
  subscription: null,
  billingState: "trial",
  availablePlans: [],
  enabledFeatures: PLAN_FEATURES.free,
  limits: defaultLimits,
  isTrialing: true,
  trialDaysRemaining: 14,
  showUpgradePrompt: false,
  upgradePromptReason: null,
  isLoading: false,
  lastFetchedAt: null,
};

// ============================================
// PLAN ACTIONS
// ============================================

export type PlanAction =
  | { type: "PLAN_FETCH_START" }
  | { type: "PLAN_FETCH_SUCCESS"; payload: { plan: Plan; subscription: Subscription } }
  | { type: "PLAN_FETCH_ERROR" }
  | { type: "PLAN_SET_AVAILABLE"; payload: Plan[] }
  | { type: "BILLING_STATE_CHANGE"; payload: { state: BillingState; reason?: string } }
  | { type: "PLAN_UPGRADE"; payload: { plan: Plan; subscription: Subscription } }
  | { type: "PLAN_DOWNGRADE"; payload: { plan: Plan; subscription: Subscription } }
  | { type: "TRIAL_UPDATE"; payload: { daysRemaining: number } }
  | { type: "SHOW_UPGRADE_PROMPT"; payload: { reason: string } }
  | { type: "DISMISS_UPGRADE_PROMPT" };

// ============================================
// PLAN REDUCER
// ============================================

export function planReducer(
  state: PlanState,
  action: PlanAction
): PlanState {
  switch (action.type) {
    case "PLAN_FETCH_START":
      return { ...state, isLoading: true };
      
    case "PLAN_FETCH_SUCCESS": {
      const { plan, subscription } = action.payload;
      return {
        ...state,
        currentPlan: plan,
        subscription,
        billingState: subscription.billingState,
        enabledFeatures: PLAN_FEATURES[plan.slug] || [],
        limits: plan.limits,
        isTrialing: subscription.status === "trialing",
        trialDaysRemaining: calculateTrialDays(subscription),
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
      };
    }
      
    case "PLAN_FETCH_ERROR":
      return { ...state, isLoading: false };
      
    case "PLAN_SET_AVAILABLE":
      return { ...state, availablePlans: action.payload };
      
    case "BILLING_STATE_CHANGE":
      return {
        ...state,
        billingState: action.payload.state,
        showUpgradePrompt: action.payload.state === "suspended",
        upgradePromptReason: action.payload.reason || null,
      };
      
    case "PLAN_UPGRADE":
    case "PLAN_DOWNGRADE": {
      const { plan, subscription } = action.payload;
      return {
        ...state,
        currentPlan: plan,
        subscription,
        billingState: subscription.billingState,
        enabledFeatures: PLAN_FEATURES[plan.slug] || [],
        limits: plan.limits,
        showUpgradePrompt: false,
        upgradePromptReason: null,
      };
    }
      
    case "TRIAL_UPDATE":
      return {
        ...state,
        trialDaysRemaining: action.payload.daysRemaining,
        isTrialing: action.payload.daysRemaining > 0,
      };
      
    case "SHOW_UPGRADE_PROMPT":
      return {
        ...state,
        showUpgradePrompt: true,
        upgradePromptReason: action.payload.reason,
      };
      
    case "DISMISS_UPGRADE_PROMPT":
      return {
        ...state,
        showUpgradePrompt: false,
      };
      
    default:
      return state;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateTrialDays(subscription: Subscription): number {
  if (!subscription.trialEnd) return 0;
  const now = new Date();
  const trialEnd = new Date(subscription.trialEnd);
  const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

// ============================================
// PLAN SELECTORS
// ============================================

export const planSelectors = {
  planSlug: (state: PlanState): PlanSlug => 
    state.currentPlan?.slug || "free",
  
  planName: (state: PlanState) => 
    state.currentPlan?.name || "Free",
  
  isFeatureEnabled: (state: PlanState, feature: FeatureFlag) =>
    state.enabledFeatures.includes(feature),
  
  canAccessFeature: (state: PlanState, feature: FeatureFlag) => {
    if (state.billingState === "suspended" || state.billingState === "cancelled") {
      return false;
    }
    return state.enabledFeatures.includes(feature);
  },
  
  getLimit: (state: PlanState, key: keyof PlanLimits) =>
    state.limits[key],
  
  isUnlimited: (state: PlanState, key: keyof PlanLimits) =>
    state.limits[key] === -1,
  
  isBillingActive: (state: PlanState) =>
    state.billingState === "active" || state.billingState === "trial",
  
  needsPayment: (state: PlanState) =>
    state.billingState === "grace" || state.billingState === "suspended",
  
  canUpgrade: (state: PlanState) =>
    state.currentPlan?.slug !== "enterprise",
  
  getUpgradePlan: (state: PlanState): Plan | null => {
    const currentTier = state.currentPlan?.tier || 0;
    return state.availablePlans.find(p => p.tier === currentTier + 1) || null;
  },
};

// ============================================
// BILLING STATE BEHAVIORS
// ============================================

export interface BillingStateBehavior {
  canCreateProxy: boolean;
  canAccessAnalytics: boolean;
  canInviteUsers: boolean;
  canExportData: boolean;
  showWarningBanner: boolean;
  bannerMessage: string | null;
  restrictedActions: string[];
}

export const BILLING_STATE_BEHAVIORS: Record<BillingState, BillingStateBehavior> = {
  trial: {
    canCreateProxy: true,
    canAccessAnalytics: true,
    canInviteUsers: true,
    canExportData: true,
    showWarningBanner: true,
    bannerMessage: "You're on a free trial",
    restrictedActions: [],
  },
  active: {
    canCreateProxy: true,
    canAccessAnalytics: true,
    canInviteUsers: true,
    canExportData: true,
    showWarningBanner: false,
    bannerMessage: null,
    restrictedActions: [],
  },
  grace: {
    canCreateProxy: true,
    canAccessAnalytics: true,
    canInviteUsers: false,
    canExportData: true,
    showWarningBanner: true,
    bannerMessage: "Payment failed. Please update your payment method.",
    restrictedActions: ["user:invite"],
  },
  suspended: {
    canCreateProxy: false,
    canAccessAnalytics: true,
    canInviteUsers: false,
    canExportData: false,
    showWarningBanner: true,
    bannerMessage: "Your account is suspended. Please update payment to restore access.",
    restrictedActions: ["proxy:create", "proxy:update", "user:invite", "usage:export"],
  },
  cancelled: {
    canCreateProxy: false,
    canAccessAnalytics: false,
    canInviteUsers: false,
    canExportData: false,
    showWarningBanner: true,
    bannerMessage: "Your subscription has been cancelled.",
    restrictedActions: ["proxy:create", "proxy:update", "user:invite", "usage:export", "usage:view"],
  },
};

export function getBillingBehavior(state: BillingState): BillingStateBehavior {
  return BILLING_STATE_BEHAVIORS[state];
}
