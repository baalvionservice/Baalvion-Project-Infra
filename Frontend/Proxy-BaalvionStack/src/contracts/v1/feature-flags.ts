/**
 * Feature Flags Contracts v1
 * Feature flag system for controlled rollouts
 * 
 * STATE OWNERSHIP: FeatureFlagState
 */

import { UUID, Timestamp } from "./base";
import { PlanSlug } from "./billing";
import { RoleType } from "./identity";

// ============================================
// FEATURE FLAG DEFINITION
// ============================================

export interface FeatureFlagDefinition {
  key: FeatureFlagKey;
  name: string;
  description: string;
  category: FeatureFlagCategory;
  defaultValue: boolean;
  
  // Targeting
  enabledForPlans?: PlanSlug[];
  enabledForRoles?: RoleType[];
  enabledForOrgs?: UUID[];
  enabledForUsers?: UUID[];
  
  // Rollout
  rolloutPercentage?: number; // 0-100
  
  // Lifecycle
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deprecatedAt?: Timestamp;
  
  // Metadata
  metadata: Record<string, unknown>;
}

// ============================================
// FEATURE FLAG KEYS
// ============================================

export type FeatureFlagKey =
  // UI Features
  | "ui.new_dashboard"
  | "ui.dark_mode"
  | "ui.advanced_filters"
  | "ui.bulk_actions"
  | "ui.keyboard_shortcuts"
  | "ui.guided_tour"
  // Proxy Features
  | "proxy.sticky_sessions"
  | "proxy.geo_targeting"
  | "proxy.custom_rotation"
  | "proxy.dedicated_ips"
  // Analytics Features
  | "analytics.advanced"
  | "analytics.real_time"
  | "analytics.export"
  | "analytics.custom_reports"
  // Integration Features
  | "integration.webhooks"
  | "integration.api_v2"
  | "integration.sso"
  | "integration.custom"
  // Admin Features
  | "admin.audit_logs"
  | "admin.user_impersonation"
  | "admin.advanced_billing"
  // Experimental Features
  | "experiment.ai_routing"
  | "experiment.predictive_scaling"
  | "experiment.auto_optimization"
  // Kill Switches
  | "killswitch.maintenance_mode"
  | "killswitch.disable_signups"
  | "killswitch.disable_api"
  | "killswitch.read_only_mode";

// ============================================
// FEATURE FLAG CATEGORIES
// ============================================

export type FeatureFlagCategory =
  | "ui"
  | "proxy"
  | "analytics"
  | "integration"
  | "admin"
  | "experiment"
  | "killswitch";

// ============================================
// FEATURE FLAG STATE
// ============================================

export interface FeatureFlagState {
  flags: Record<FeatureFlagKey, boolean>;
  overrides: Record<FeatureFlagKey, boolean>;
  loading: boolean;
  lastFetched: Timestamp | null;
}

export const initialFeatureFlagState: FeatureFlagState = {
  flags: {} as Record<FeatureFlagKey, boolean>,
  overrides: {} as Record<FeatureFlagKey, boolean>,
  loading: false,
  lastFetched: null,
};

// ============================================
// DEFAULT FLAG VALUES
// ============================================

export const DEFAULT_FEATURE_FLAGS: Record<FeatureFlagKey, boolean> = {
  // UI Features - enabled by default
  "ui.new_dashboard": true,
  "ui.dark_mode": true,
  "ui.advanced_filters": true,
  "ui.bulk_actions": true,
  "ui.keyboard_shortcuts": true,
  "ui.guided_tour": true,
  
  // Proxy Features - plan gated
  "proxy.sticky_sessions": true,
  "proxy.geo_targeting": true,
  "proxy.custom_rotation": false,
  "proxy.dedicated_ips": false,
  
  // Analytics Features - plan gated
  "analytics.advanced": false,
  "analytics.real_time": true,
  "analytics.export": true,
  "analytics.custom_reports": false,
  
  // Integration Features - plan gated
  "integration.webhooks": false,
  "integration.api_v2": false,
  "integration.sso": false,
  "integration.custom": false,
  
  // Admin Features - role gated
  "admin.audit_logs": true,
  "admin.user_impersonation": false,
  "admin.advanced_billing": false,
  
  // Experimental Features - disabled by default
  "experiment.ai_routing": false,
  "experiment.predictive_scaling": false,
  "experiment.auto_optimization": false,
  
  // Kill Switches - all off by default
  "killswitch.maintenance_mode": false,
  "killswitch.disable_signups": false,
  "killswitch.disable_api": false,
  "killswitch.read_only_mode": false,
};

// ============================================
// FEATURE FLAG HELPERS
// ============================================

export function isFeatureEnabled(
  key: FeatureFlagKey,
  state: FeatureFlagState
): boolean {
  // Check overrides first (admin/demo overrides)
  if (key in state.overrides) {
    return state.overrides[key];
  }
  
  // Check fetched flags
  if (key in state.flags) {
    return state.flags[key];
  }
  
  // Fall back to defaults
  return DEFAULT_FEATURE_FLAGS[key] ?? false;
}

export function getFeatureFlagsByCategory(
  category: FeatureFlagCategory
): FeatureFlagKey[] {
  return (Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[]).filter(
    key => key.startsWith(`${category}.`)
  );
}

// ============================================
// FEATURE FLAG EVALUATION CONTEXT
// ============================================

export interface FeatureFlagContext {
  userId?: UUID;
  orgId?: UUID;
  planSlug?: PlanSlug;
  roleType?: RoleType;
  environment: "development" | "staging" | "production";
}

export function evaluateFeatureFlag(
  definition: FeatureFlagDefinition,
  context: FeatureFlagContext
): boolean {
  // Check kill switches first
  if (definition.key.startsWith("killswitch.")) {
    return definition.defaultValue;
  }
  
  // Check plan targeting
  if (definition.enabledForPlans?.length && context.planSlug) {
    if (!definition.enabledForPlans.includes(context.planSlug)) {
      return false;
    }
  }
  
  // Check role targeting
  if (definition.enabledForRoles?.length && context.roleType) {
    if (!definition.enabledForRoles.includes(context.roleType)) {
      return false;
    }
  }
  
  // Check org targeting
  if (definition.enabledForOrgs?.length && context.orgId) {
    if (!definition.enabledForOrgs.includes(context.orgId)) {
      return false;
    }
  }
  
  // Check user targeting
  if (definition.enabledForUsers?.length && context.userId) {
    if (!definition.enabledForUsers.includes(context.userId)) {
      return false;
    }
  }
  
  // Check rollout percentage
  if (definition.rolloutPercentage !== undefined && context.userId) {
    const hash = simpleHash(context.userId + definition.key);
    if (hash > definition.rolloutPercentage) {
      return false;
    }
  }
  
  return definition.defaultValue;
}

// Simple deterministic hash for rollout
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}
