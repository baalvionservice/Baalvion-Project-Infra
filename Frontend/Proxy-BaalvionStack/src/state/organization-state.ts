/**
 * Organization State
 * 
 * OWNERSHIP: Shared between client and server
 * SCOPE: Current organization (tenant)
 * PERSISTENCE: localStorage for cache, server is source of truth
 * 
 * Contains organization settings, members, and workspaces.
 * Multi-tenancy: Users may belong to multiple orgs.
 */

import { UUID, Timestamp } from "@/contracts/v1/base";
import { Organization, Workspace, OrgMembership } from "@/contracts/v1/identity";

// ============================================
// ORGANIZATION STATE INTERFACE
// ============================================

export interface OrganizationState {
  // Current org
  currentOrg: Organization | null;
  
  // User's orgs (for switcher)
  userOrgs: OrganizationSummary[];
  
  // Workspaces in current org
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  
  // Members in current org
  members: OrgMembership[];
  
  // Loading states
  isLoading: boolean;
  isLoadingMembers: boolean;
  isLoadingWorkspaces: boolean;
  
  // Cache metadata
  lastFetchedAt: Timestamp | null;
}

export interface OrganizationSummary {
  id: UUID;
  name: string;
  slug: string;
  logoUrl?: string;
  role: string;
}

// ============================================
// INITIAL STATE
// ============================================

export const initialOrganizationState: OrganizationState = {
  currentOrg: null,
  userOrgs: [],
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,
  isLoadingMembers: false,
  isLoadingWorkspaces: false,
  lastFetchedAt: null,
};

// ============================================
// ORGANIZATION ACTIONS
// ============================================

export type OrganizationAction =
  | { type: "ORG_FETCH_START" }
  | { type: "ORG_FETCH_SUCCESS"; payload: Organization }
  | { type: "ORG_FETCH_ERROR" }
  | { type: "ORG_SET_USER_ORGS"; payload: OrganizationSummary[] }
  | { type: "ORG_SWITCH"; payload: { org: Organization } }
  | { type: "ORG_UPDATE_SETTINGS"; payload: Partial<Organization> }
  | { type: "WORKSPACE_FETCH_SUCCESS"; payload: Workspace[] }
  | { type: "WORKSPACE_SWITCH"; payload: { workspace: Workspace | null } }
  | { type: "WORKSPACE_CREATE"; payload: Workspace }
  | { type: "MEMBERS_FETCH_START" }
  | { type: "MEMBERS_FETCH_SUCCESS"; payload: OrgMembership[] }
  | { type: "MEMBER_ADD"; payload: OrgMembership }
  | { type: "MEMBER_REMOVE"; payload: { userId: UUID } }
  | { type: "MEMBER_UPDATE_ROLE"; payload: { userId: UUID; roleId: UUID } };

// ============================================
// ORGANIZATION REDUCER
// ============================================

export function organizationReducer(
  state: OrganizationState,
  action: OrganizationAction
): OrganizationState {
  switch (action.type) {
    case "ORG_FETCH_START":
      return { ...state, isLoading: true };
      
    case "ORG_FETCH_SUCCESS":
      return {
        ...state,
        currentOrg: action.payload,
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
      };
      
    case "ORG_FETCH_ERROR":
      return { ...state, isLoading: false };
      
    case "ORG_SET_USER_ORGS":
      return { ...state, userOrgs: action.payload };
      
    case "ORG_SWITCH":
      return {
        ...state,
        currentOrg: action.payload.org,
        workspaces: [],
        currentWorkspace: null,
        members: [],
      };
      
    case "ORG_UPDATE_SETTINGS":
      return {
        ...state,
        currentOrg: state.currentOrg 
          ? { ...state.currentOrg, ...action.payload }
          : null,
      };
      
    case "WORKSPACE_FETCH_SUCCESS":
      return {
        ...state,
        workspaces: action.payload,
        isLoadingWorkspaces: false,
      };
      
    case "WORKSPACE_SWITCH":
      return { ...state, currentWorkspace: action.payload.workspace };
      
    case "WORKSPACE_CREATE":
      return {
        ...state,
        workspaces: [...state.workspaces, action.payload],
      };
      
    case "MEMBERS_FETCH_START":
      return { ...state, isLoadingMembers: true };
      
    case "MEMBERS_FETCH_SUCCESS":
      return {
        ...state,
        members: action.payload,
        isLoadingMembers: false,
      };
      
    case "MEMBER_ADD":
      return {
        ...state,
        members: [...state.members, action.payload],
      };
      
    case "MEMBER_REMOVE":
      return {
        ...state,
        members: state.members.filter(m => m.userId !== action.payload.userId),
      };
      
    case "MEMBER_UPDATE_ROLE":
      return {
        ...state,
        members: state.members.map(m =>
          m.userId === action.payload.userId
            ? { ...m, roleId: action.payload.roleId }
            : m
        ),
      };
      
    default:
      return state;
  }
}

// ============================================
// ORGANIZATION SELECTORS
// ============================================

export const organizationSelectors = {
  currentOrgId: (state: OrganizationState) => state.currentOrg?.id ?? null,
  
  currentOrgName: (state: OrganizationState) => state.currentOrg?.name ?? "",
  
  hasMultipleOrgs: (state: OrganizationState) => state.userOrgs.length > 1,
  
  workspaceCount: (state: OrganizationState) => state.workspaces.length,
  
  memberCount: (state: OrganizationState) => state.members.length,
  
  activeMemberCount: (state: OrganizationState) => 
    state.members.filter(m => m.status === "active").length,
  
  getMember: (state: OrganizationState, userId: UUID) =>
    state.members.find(m => m.userId === userId),
  
  getWorkspace: (state: OrganizationState, workspaceId: UUID) =>
    state.workspaces.find(w => w.id === workspaceId),
};

// ============================================
// ORGANIZATION CACHE
// ============================================

const ORG_CACHE_KEY = "baalvion_org_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function cacheOrganization(state: OrganizationState): void {
  try {
    localStorage.setItem(ORG_CACHE_KEY, JSON.stringify({
      currentOrg: state.currentOrg,
      userOrgs: state.userOrgs,
      cachedAt: Date.now(),
    }));
  } catch (e) {
    console.error("Failed to cache organization state", e);
  }
}

export function loadOrganizationCache(): Partial<OrganizationState> | null {
  try {
    const cached = localStorage.getItem(ORG_CACHE_KEY);
    if (!cached) return null;
    
    const { currentOrg, userOrgs, cachedAt } = JSON.parse(cached);
    if (Date.now() - cachedAt > CACHE_TTL) {
      localStorage.removeItem(ORG_CACHE_KEY);
      return null;
    }
    
    return { currentOrg, userOrgs };
  } catch (e) {
    return null;
  }
}
