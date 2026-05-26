/**
 * Session State
 * 
 * OWNERSHIP: Client-only, ephemeral
 * SCOPE: Current browser session
 * PERSISTENCE: sessionStorage only
 * 
 * Contains authentication state and current session info.
 * This state is reset on logout or session expiry.
 */

import { UUID, Timestamp } from "@/contracts/v1/base";
import { Session, Permission, RoleType } from "@/contracts/v1/identity";

// ============================================
// SESSION STATE INTERFACE
// ============================================

export interface SessionState {
  // Authentication
  isAuthenticated: boolean;
  session: Session | null;
  
  // Current context
  currentOrgId: UUID | null;
  currentWorkspaceId: UUID | null;
  currentRoleType: RoleType;
  permissions: Permission[];
  
  // Session metadata
  sessionStartedAt: Timestamp | null;
  lastActivityAt: Timestamp | null;
  expiresAt: Timestamp | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
}

// ============================================
// INITIAL STATE
// ============================================

export const initialSessionState: SessionState = {
  isAuthenticated: false,
  session: null,
  currentOrgId: null,
  currentWorkspaceId: null,
  currentRoleType: "member",
  permissions: [],
  sessionStartedAt: null,
  lastActivityAt: null,
  expiresAt: null,
  isLoading: true,
  isInitialized: false,
};

// ============================================
// SESSION ACTIONS
// ============================================

export type SessionAction =
  | { type: "SESSION_INIT_START" }
  | { type: "SESSION_INIT_SUCCESS"; payload: Partial<SessionState> }
  | { type: "SESSION_INIT_ERROR" }
  | { type: "SESSION_LOGIN"; payload: Session }
  | { type: "SESSION_LOGOUT" }
  | { type: "SESSION_REFRESH"; payload: { expiresAt: Timestamp } }
  | { type: "SESSION_SWITCH_ORG"; payload: { orgId: UUID } }
  | { type: "SESSION_SWITCH_WORKSPACE"; payload: { workspaceId: UUID } }
  | { type: "SESSION_UPDATE_ACTIVITY" }
  | { type: "SESSION_EXPIRED" };

// ============================================
// SESSION REDUCER
// ============================================

export function sessionReducer(
  state: SessionState,
  action: SessionAction
): SessionState {
  switch (action.type) {
    case "SESSION_INIT_START":
      return { ...state, isLoading: true };
      
    case "SESSION_INIT_SUCCESS":
      return { 
        ...state, 
        ...action.payload,
        isLoading: false,
        isInitialized: true,
      };
      
    case "SESSION_INIT_ERROR":
      return { 
        ...initialSessionState,
        isLoading: false,
        isInitialized: true,
      };
      
    case "SESSION_LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        session: action.payload,
        currentOrgId: action.payload.orgId,
        currentWorkspaceId: action.payload.workspaceId || null,
        currentRoleType: action.payload.roleType,
        permissions: action.payload.permissions,
        sessionStartedAt: action.payload.createdAt,
        expiresAt: action.payload.expiresAt,
        lastActivityAt: new Date().toISOString(),
      };
      
    case "SESSION_LOGOUT":
      return { ...initialSessionState, isInitialized: true, isLoading: false };
      
    case "SESSION_REFRESH":
      return {
        ...state,
        expiresAt: action.payload.expiresAt,
        lastActivityAt: new Date().toISOString(),
      };
      
    case "SESSION_SWITCH_ORG":
      return {
        ...state,
        currentOrgId: action.payload.orgId,
        currentWorkspaceId: null, // Reset workspace on org switch
      };
      
    case "SESSION_SWITCH_WORKSPACE":
      return {
        ...state,
        currentWorkspaceId: action.payload.workspaceId,
      };
      
    case "SESSION_UPDATE_ACTIVITY":
      return {
        ...state,
        lastActivityAt: new Date().toISOString(),
      };
      
    case "SESSION_EXPIRED":
      return { ...initialSessionState, isInitialized: true, isLoading: false };
      
    default:
      return state;
  }
}

// ============================================
// SESSION SELECTORS
// ============================================

export const sessionSelectors = {
  isAuthenticated: (state: SessionState) => state.isAuthenticated,
  
  currentOrg: (state: SessionState) => state.currentOrgId,
  
  currentWorkspace: (state: SessionState) => state.currentWorkspaceId,
  
  hasPermission: (state: SessionState, permission: Permission) => 
    state.permissions.includes(permission),
  
  hasAnyPermission: (state: SessionState, permissions: Permission[]) =>
    permissions.some(p => state.permissions.includes(p)),
  
  hasAllPermissions: (state: SessionState, permissions: Permission[]) =>
    permissions.every(p => state.permissions.includes(p)),
  
  isSessionExpired: (state: SessionState) => {
    if (!state.expiresAt) return true;
    return new Date(state.expiresAt) < new Date();
  },
  
  sessionTimeRemaining: (state: SessionState) => {
    if (!state.expiresAt) return 0;
    return Math.max(0, new Date(state.expiresAt).getTime() - Date.now());
  },
};

// ============================================
// SESSION PERSISTENCE
// ============================================

const SESSION_STORAGE_KEY = "baalvion_session";

export function persistSession(state: SessionState): void {
  try {
    const serialized = JSON.stringify({
      isAuthenticated: state.isAuthenticated,
      session: state.session,
      currentOrgId: state.currentOrgId,
      currentWorkspaceId: state.currentWorkspaceId,
      currentRoleType: state.currentRoleType,
      permissions: state.permissions,
      expiresAt: state.expiresAt,
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch (e) {
    console.error("Failed to persist session state", e);
  }
}

export function loadSession(): Partial<SessionState> | null {
  try {
    const serialized = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (e) {
    console.error("Failed to load session state", e);
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
