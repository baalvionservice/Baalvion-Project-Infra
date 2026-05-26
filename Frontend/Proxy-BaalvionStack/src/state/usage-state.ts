/**
 * Usage State
 * 
 * OWNERSHIP: Server provides data, client displays
 * SCOPE: Current billing period
 * PERSISTENCE: No persistence, always fresh from server
 * 
 * Contains usage metrics, quotas, and warning levels.
 */

import { UUID, Timestamp } from "@/contracts/v1/base";
import { 
  UsageRecord, 
  UsageMetrics, 
  UsagePercentages, 
  UsageOverages,
  UsageWarningLevel,
  UsageThresholds,
  DEFAULT_USAGE_THRESHOLDS,
  PlanLimits,
} from "@/contracts/v1/billing";

// ============================================
// USAGE STATE INTERFACE
// ============================================

export interface UsageState {
  // Current period usage
  currentUsage: UsageMetrics;
  
  // Limits from plan
  limits: PlanLimits;
  
  // Percentages
  percentages: UsagePercentages;
  
  // Overages
  overages: UsageOverages;
  
  // Warning levels for each metric
  warningLevels: {
    bandwidth: UsageWarningLevel;
    requests: UsageWarningLevel;
    proxies: UsageWarningLevel;
    subUsers: UsageWarningLevel;
  };
  
  // Overall warning level (highest)
  overallWarningLevel: UsageWarningLevel;
  
  // Period info
  periodStart: Timestamp | null;
  periodEnd: Timestamp | null;
  daysRemaining: number;
  
  // Historical data (for charts)
  history: UsageHistoryPoint[];
  
  // Loading
  isLoading: boolean;
  lastFetchedAt: Timestamp | null;
  
  // Thresholds (configurable)
  thresholds: UsageThresholds;
}

export interface UsageHistoryPoint {
  date: string;
  bandwidth: number;
  requests: number;
  successRate: number;
}

// ============================================
// INITIAL STATE
// ============================================

export const initialUsageState: UsageState = {
  currentUsage: {
    bandwidthUsed: 0,
    requestsCount: 0,
    successCount: 0,
    errorCount: 0,
    activeProxies: 0,
    activeSubUsers: 0,
    activeApiKeys: 0,
    avgLatency: 0,
  },
  limits: {
    bandwidth: 1024,
    requests: 10000,
    proxies: 10,
    subUsers: 0,
    apiKeys: 1,
    presets: 3,
    sessionDuration: 5,
    countries: 5,
  },
  percentages: {
    bandwidth: 0,
    requests: 0,
    proxies: 0,
    subUsers: 0,
  },
  overages: {
    bandwidth: 0,
    requests: 0,
    overageCost: 0,
  },
  warningLevels: {
    bandwidth: "normal",
    requests: "normal",
    proxies: "normal",
    subUsers: "normal",
  },
  overallWarningLevel: "normal",
  periodStart: null,
  periodEnd: null,
  daysRemaining: 30,
  history: [],
  isLoading: false,
  lastFetchedAt: null,
  thresholds: DEFAULT_USAGE_THRESHOLDS,
};

// ============================================
// USAGE ACTIONS
// ============================================

export type UsageAction =
  | { type: "USAGE_FETCH_START" }
  | { type: "USAGE_FETCH_SUCCESS"; payload: UsageRecord }
  | { type: "USAGE_FETCH_ERROR" }
  | { type: "USAGE_UPDATE"; payload: Partial<UsageMetrics> }
  | { type: "USAGE_SET_LIMITS"; payload: PlanLimits }
  | { type: "USAGE_SET_HISTORY"; payload: UsageHistoryPoint[] }
  | { type: "USAGE_SET_THRESHOLDS"; payload: Partial<UsageThresholds> }
  | { type: "USAGE_RESET" };

// ============================================
// USAGE REDUCER
// ============================================

export function usageReducer(
  state: UsageState,
  action: UsageAction
): UsageState {
  switch (action.type) {
    case "USAGE_FETCH_START":
      return { ...state, isLoading: true };
      
    case "USAGE_FETCH_SUCCESS": {
      const { metrics, limits, percentages, overages, periodStart, periodEnd } = action.payload;
      const warningLevels = calculateWarningLevels(percentages, state.thresholds);
      return {
        ...state,
        currentUsage: metrics,
        limits,
        percentages,
        overages,
        warningLevels,
        overallWarningLevel: getHighestWarningLevel(warningLevels),
        periodStart,
        periodEnd,
        daysRemaining: calculateDaysRemaining(periodEnd),
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
      };
    }
      
    case "USAGE_FETCH_ERROR":
      return { ...state, isLoading: false };
      
    case "USAGE_UPDATE": {
      const updatedUsage = { ...state.currentUsage, ...action.payload };
      const percentages = calculatePercentages(updatedUsage, state.limits);
      const warningLevels = calculateWarningLevels(percentages, state.thresholds);
      return {
        ...state,
        currentUsage: updatedUsage,
        percentages,
        warningLevels,
        overallWarningLevel: getHighestWarningLevel(warningLevels),
      };
    }
      
    case "USAGE_SET_LIMITS": {
      const percentages = calculatePercentages(state.currentUsage, action.payload);
      const warningLevels = calculateWarningLevels(percentages, state.thresholds);
      return {
        ...state,
        limits: action.payload,
        percentages,
        warningLevels,
        overallWarningLevel: getHighestWarningLevel(warningLevels),
      };
    }
      
    case "USAGE_SET_HISTORY":
      return { ...state, history: action.payload };
      
    case "USAGE_SET_THRESHOLDS":
      return {
        ...state,
        thresholds: { ...state.thresholds, ...action.payload },
      };
      
    case "USAGE_RESET":
      return initialUsageState;
      
    default:
      return state;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculatePercentages(usage: UsageMetrics, limits: PlanLimits): UsagePercentages {
  return {
    bandwidth: limits.bandwidth === -1 ? 0 : (usage.bandwidthUsed / limits.bandwidth) * 100,
    requests: limits.requests === -1 ? 0 : (usage.requestsCount / limits.requests) * 100,
    proxies: limits.proxies === -1 ? 0 : (usage.activeProxies / limits.proxies) * 100,
    subUsers: limits.subUsers === -1 ? 0 : (usage.activeSubUsers / limits.subUsers) * 100,
  };
}

function calculateWarningLevels(
  percentages: UsagePercentages,
  thresholds: UsageThresholds
): Record<keyof UsagePercentages, UsageWarningLevel> {
  const getLevel = (pct: number): UsageWarningLevel => {
    if (pct >= thresholds.exceeded) return "exceeded";
    if (pct >= thresholds.critical) return "critical";
    if (pct >= thresholds.warning) return "warning";
    return "normal";
  };
  
  return {
    bandwidth: getLevel(percentages.bandwidth),
    requests: getLevel(percentages.requests),
    proxies: getLevel(percentages.proxies),
    subUsers: getLevel(percentages.subUsers),
  };
}

function getHighestWarningLevel(
  levels: Record<string, UsageWarningLevel>
): UsageWarningLevel {
  const priority: UsageWarningLevel[] = ["exceeded", "critical", "warning", "normal"];
  for (const level of priority) {
    if (Object.values(levels).includes(level)) {
      return level;
    }
  }
  return "normal";
}

function calculateDaysRemaining(periodEnd: Timestamp | null): number {
  if (!periodEnd) return 30;
  const end = new Date(periodEnd);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ============================================
// USAGE SELECTORS
// ============================================

export const usageSelectors = {
  bandwidthUsed: (state: UsageState) => state.currentUsage.bandwidthUsed,
  
  bandwidthPercent: (state: UsageState) => state.percentages.bandwidth,
  
  bandwidthRemaining: (state: UsageState) => 
    Math.max(0, state.limits.bandwidth - state.currentUsage.bandwidthUsed),
  
  isOverLimit: (state: UsageState, metric: keyof UsagePercentages) =>
    state.warningLevels[metric] === "exceeded",
  
  hasAnyWarning: (state: UsageState) =>
    state.overallWarningLevel !== "normal",
  
  successRate: (state: UsageState) => {
    const total = state.currentUsage.successCount + state.currentUsage.errorCount;
    if (total === 0) return 100;
    return (state.currentUsage.successCount / total) * 100;
  },
  
  dailyBudget: (state: UsageState) => {
    if (state.daysRemaining === 0) return 0;
    const remaining = state.limits.bandwidth - state.currentUsage.bandwidthUsed;
    return Math.max(0, remaining / state.daysRemaining);
  },
  
  projectedOverage: (state: UsageState) => {
    const dailyRate = state.currentUsage.bandwidthUsed / Math.max(1, 30 - state.daysRemaining);
    const projected = dailyRate * 30;
    return Math.max(0, projected - state.limits.bandwidth);
  },
};

// ============================================
// WARNING DISPLAY CONFIG
// ============================================

export interface WarningDisplayConfig {
  color: string;
  bgColor: string;
  icon: string;
  message: string;
}

export const WARNING_DISPLAY: Record<UsageWarningLevel, WarningDisplayConfig> = {
  normal: {
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    icon: "check",
    message: "Usage is within normal limits",
  },
  warning: {
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    icon: "alert-triangle",
    message: "Approaching usage limit (80%)",
  },
  critical: {
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    icon: "alert-circle",
    message: "Near usage limit (90%)",
  },
  exceeded: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    icon: "x-circle",
    message: "Usage limit exceeded",
  },
};
