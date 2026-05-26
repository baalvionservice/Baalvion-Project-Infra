/**
 * User State
 * 
 * OWNERSHIP: Shared between client and server
 * SCOPE: Current authenticated user
 * PERSISTENCE: localStorage for preferences, server for profile
 * 
 * Contains user profile, preferences, and notification settings.
 */

import { UUID, Timestamp } from "@/contracts/v1/base";
import { User, UserPreferences } from "@/contracts/v1/identity";

// ============================================
// USER STATE INTERFACE
// ============================================

export interface UserState {
  // Current user
  user: User | null;
  
  // Preferences (can be edited locally)
  preferences: UserPreferences;
  
  // Profile completion
  profileComplete: boolean;
  profileCompletion: number; // 0-100
  
  // Onboarding
  onboardingComplete: boolean;
  onboardingStep: number;
  onboardingSkipped: boolean;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  
  // Last sync
  lastSyncedAt: Timestamp | null;
}

// ============================================
// DEFAULT PREFERENCES
// ============================================

export const defaultPreferences: UserPreferences = {
  theme: "system",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale: navigator.language || "en-US",
  notifications: {
    email: true,
    push: true,
    sms: false,
    digest: "daily",
  },
};

// ============================================
// INITIAL STATE
// ============================================

export const initialUserState: UserState = {
  user: null,
  preferences: defaultPreferences,
  profileComplete: false,
  profileCompletion: 0,
  onboardingComplete: false,
  onboardingStep: 0,
  onboardingSkipped: false,
  isLoading: false,
  isSaving: false,
  lastSyncedAt: null,
};

// ============================================
// USER ACTIONS
// ============================================

export type UserAction =
  | { type: "USER_FETCH_START" }
  | { type: "USER_FETCH_SUCCESS"; payload: User }
  | { type: "USER_FETCH_ERROR" }
  | { type: "USER_UPDATE_PROFILE"; payload: Partial<User> }
  | { type: "USER_UPDATE_PREFERENCES"; payload: Partial<UserPreferences> }
  | { type: "USER_SAVE_START" }
  | { type: "USER_SAVE_SUCCESS" }
  | { type: "USER_SAVE_ERROR" }
  | { type: "ONBOARDING_SET_STEP"; payload: number }
  | { type: "ONBOARDING_COMPLETE" }
  | { type: "ONBOARDING_SKIP" }
  | { type: "ONBOARDING_RESTART" }
  | { type: "USER_CLEAR" };

// ============================================
// USER REDUCER
// ============================================

export function userReducer(
  state: UserState,
  action: UserAction
): UserState {
  switch (action.type) {
    case "USER_FETCH_START":
      return { ...state, isLoading: true };
      
    case "USER_FETCH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        preferences: action.payload.preferences || defaultPreferences,
        profileComplete: calculateProfileComplete(action.payload),
        profileCompletion: calculateProfileCompletion(action.payload),
        isLoading: false,
        lastSyncedAt: new Date().toISOString(),
      };
      
    case "USER_FETCH_ERROR":
      return { ...state, isLoading: false };
      
    case "USER_UPDATE_PROFILE":
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...action.payload };
      return {
        ...state,
        user: updatedUser,
        profileComplete: calculateProfileComplete(updatedUser),
        profileCompletion: calculateProfileCompletion(updatedUser),
      };
      
    case "USER_UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
      
    case "USER_SAVE_START":
      return { ...state, isSaving: true };
      
    case "USER_SAVE_SUCCESS":
      return { 
        ...state, 
        isSaving: false,
        lastSyncedAt: new Date().toISOString(),
      };
      
    case "USER_SAVE_ERROR":
      return { ...state, isSaving: false };
      
    case "ONBOARDING_SET_STEP":
      return { ...state, onboardingStep: action.payload };
      
    case "ONBOARDING_COMPLETE":
      return { 
        ...state, 
        onboardingComplete: true,
        onboardingStep: -1,
      };
      
    case "ONBOARDING_SKIP":
      return {
        ...state,
        onboardingComplete: true,
        onboardingSkipped: true,
      };
      
    case "ONBOARDING_RESTART":
      return {
        ...state,
        onboardingComplete: false,
        onboardingSkipped: false,
        onboardingStep: 0,
      };
      
    case "USER_CLEAR":
      return initialUserState;
      
    default:
      return state;
  }
}

// ============================================
// PROFILE COMPLETION HELPERS
// ============================================

function calculateProfileComplete(user: User): boolean {
  return !!(
    user.firstName &&
    user.lastName &&
    user.emailVerified &&
    user.phoneNumber
  );
}

function calculateProfileCompletion(user: User): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.emailVerified,
    user.phoneNumber,
    user.avatarUrl,
    user.mfaEnabled,
  ];
  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

// ============================================
// USER SELECTORS
// ============================================

export const userSelectors = {
  displayName: (state: UserState) => 
    state.user?.displayName || state.user?.firstName || "User",
  
  email: (state: UserState) => state.user?.email ?? "",
  
  avatarUrl: (state: UserState) => state.user?.avatarUrl,
  
  theme: (state: UserState) => state.preferences.theme,
  
  isEmailVerified: (state: UserState) => state.user?.emailVerified ?? false,
  
  needsOnboarding: (state: UserState) => 
    !state.onboardingComplete && !state.onboardingSkipped,
  
  profileCompletionPercent: (state: UserState) => state.profileCompletion,
};

// ============================================
// USER PERSISTENCE
// ============================================

const USER_PREFS_KEY = "baalvion_user_preferences";
const ONBOARDING_KEY = "baalvion_onboarding";

export function persistUserPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error("Failed to persist user preferences", e);
  }
}

export function loadUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(USER_PREFS_KEY);
    if (!stored) return defaultPreferences;
    return { ...defaultPreferences, ...JSON.parse(stored) };
  } catch (e) {
    return defaultPreferences;
  }
}

export function persistOnboardingState(state: Pick<UserState, 'onboardingComplete' | 'onboardingSkipped' | 'onboardingStep'>): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist onboarding state", e);
  }
}

export function loadOnboardingState(): Pick<UserState, 'onboardingComplete' | 'onboardingSkipped' | 'onboardingStep'> | null {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}
