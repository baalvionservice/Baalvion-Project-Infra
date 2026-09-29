/**
 * Feature Flag State
 * 
 * OWNERSHIP: Server provides flags, client caches
 * SCOPE: Global + org-specific overrides
 * PERSISTENCE: localStorage with TTL
 * 
 * Controls feature visibility and kill switches.
 */

import { Timestamp } from "@/contracts/v1/base";
import { 
  FeatureFlagKey, 
  FeatureFlagState as BaseFeatureFlagState,
  DEFAULT_FEATURE_FLAGS,
  isFeatureEnabled,
} from "@/contracts/v1/feature-flags";

// ============================================
// FEATURE FLAG STATE INTERFACE
// ============================================

export interface FeatureFlagState extends BaseFeatureFlagState {
  // Admin overrides (for demo/testing)
  adminOverrides: Record<FeatureFlagKey, boolean>;
  
  // Kill switch active?
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  
  // Error state
  error: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

export const initialFeatureFlagState: FeatureFlagState = {
  flags: { ...DEFAULT_FEATURE_FLAGS },
  overrides: {} as Record<FeatureFlagKey, boolean>,
  adminOverrides: {} as Record<FeatureFlagKey, boolean>,
  loading: false,
  lastFetched: null,
  maintenanceMode: false,
  readOnlyMode: false,
  error: null,
};

// ============================================
// FEATURE FLAG ACTIONS
// ============================================

export type FeatureFlagAction =
  | { type: "FLAGS_FETCH_START" }
  | { type: "FLAGS_FETCH_SUCCESS"; payload: Record<FeatureFlagKey, boolean> }
  | { type: "FLAGS_FETCH_ERROR"; payload: string }
  | { type: "FLAGS_SET_OVERRIDE"; payload: { key: FeatureFlagKey; value: boolean } }
  | { type: "FLAGS_CLEAR_OVERRIDE"; payload: FeatureFlagKey }
  | { type: "FLAGS_CLEAR_ALL_OVERRIDES" }
  | { type: "FLAGS_SET_ADMIN_OVERRIDE"; payload: { key: FeatureFlagKey; value: boolean } }
  | { type: "FLAGS_CLEAR_ADMIN_OVERRIDES" }
  | { type: "FLAGS_SET_MAINTENANCE"; payload: boolean }
  | { type: "FLAGS_SET_READONLY"; payload: boolean };

// ============================================
// FEATURE FLAG REDUCER
// ============================================

export function featureFlagReducer(
  state: FeatureFlagState,
  action: FeatureFlagAction
): FeatureFlagState {
  switch (action.type) {
    case "FLAGS_FETCH_START":
      return { ...state, loading: true, error: null };
      
    case "FLAGS_FETCH_SUCCESS":
      return {
        ...state,
        flags: { ...DEFAULT_FEATURE_FLAGS, ...action.payload },
        loading: false,
        lastFetched: new Date().toISOString(),
        maintenanceMode: action.payload["killswitch.maintenance_mode"] ?? false,
        readOnlyMode: action.payload["killswitch.read_only_mode"] ?? false,
      };
      
    case "FLAGS_FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
      
    case "FLAGS_SET_OVERRIDE":
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case "FLAGS_CLEAR_OVERRIDE": {
      const { [action.payload]: _, ...rest } = state.overrides;
      return { ...state, overrides: rest as Record<FeatureFlagKey, boolean> };
    }
      
    case "FLAGS_CLEAR_ALL_OVERRIDES":
      return { ...state, overrides: {} as Record<FeatureFlagKey, boolean> };
      
    case "FLAGS_SET_ADMIN_OVERRIDE":
      return {
        ...state,
        adminOverrides: {
          ...state.adminOverrides,
          [action.payload.key]: action.payload.value,
        },
      };
      
    case "FLAGS_CLEAR_ADMIN_OVERRIDES":
      return { ...state, adminOverrides: {} as Record<FeatureFlagKey, boolean> };
      
    case "FLAGS_SET_MAINTENANCE":
      return { ...state, maintenanceMode: action.payload };
      
    case "FLAGS_SET_READONLY":
      return { ...state, readOnlyMode: action.payload };
      
    default:
      return state;
  }
}

// ============================================
// FEATURE FLAG SELECTORS
// ============================================

export const featureFlagSelectors = {
  isEnabled: (state: FeatureFlagState, key: FeatureFlagKey): boolean => {
    // Admin overrides take highest priority
    if (key in state.adminOverrides) {
      return state.adminOverrides[key];
    }
    // Then user/org overrides
    if (key in state.overrides) {
      return state.overrides[key];
    }
    // Then fetched flags
    if (key in state.flags) {
      return state.flags[key];
    }
    // Fall back to defaults
    return DEFAULT_FEATURE_FLAGS[key] ?? false;
  },
  
  isMaintenanceMode: (state: FeatureFlagState) => state.maintenanceMode,
  
  isReadOnlyMode: (state: FeatureFlagState) => state.readOnlyMode,
  
  hasOverride: (state: FeatureFlagState, key: FeatureFlagKey) =>
    key in state.overrides || key in state.adminOverrides,
  
  getAllEnabled: (state: FeatureFlagState): FeatureFlagKey[] =>
    (Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[]).filter(
      key => featureFlagSelectors.isEnabled(state, key)
    ),
  
  getAllDisabled: (state: FeatureFlagState): FeatureFlagKey[] =>
    (Object.keys(DEFAULT_FEATURE_FLAGS) as FeatureFlagKey[]).filter(
      key => !featureFlagSelectors.isEnabled(state, key)
    ),
};

// ============================================
// FEATURE FLAG PERSISTENCE
// ============================================

const FLAGS_CACHE_KEY = "baalvion_feature_flags";
const FLAGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function persistFeatureFlags(state: FeatureFlagState): void {
  try {
    localStorage.setItem(FLAGS_CACHE_KEY, JSON.stringify({
      flags: state.flags,
      overrides: state.overrides,
      cachedAt: Date.now(),
    }));
  } catch (e) {
    console.error("Failed to cache feature flags", e);
  }
}

export function loadFeatureFlags(): Partial<FeatureFlagState> | null {
  try {
    const cached = localStorage.getItem(FLAGS_CACHE_KEY);
    if (!cached) return null;
    
    const { flags, overrides, cachedAt } = JSON.parse(cached);
    if (Date.now() - cachedAt > FLAGS_CACHE_TTL) {
      localStorage.removeItem(FLAGS_CACHE_KEY);
      return null;
    }
    
    return { flags, overrides };
  } catch (e) {
    return null;
  }
}

// ============================================
// FEATURE FLAG HELPERS
// ============================================

/**
 * Hook-friendly feature check
 */
export function useFeatureFlag(
  state: FeatureFlagState,
  key: FeatureFlagKey
): { enabled: boolean; loading: boolean } {
  return {
    enabled: featureFlagSelectors.isEnabled(state, key),
    loading: state.loading,
  };
}

/**
 * Conditional rendering helper
 */
export function withFeatureFlag<T>(
  state: FeatureFlagState,
  key: FeatureFlagKey,
  enabledValue: T,
  disabledValue: T
): T {
  return featureFlagSelectors.isEnabled(state, key) ? enabledValue : disabledValue;
}
