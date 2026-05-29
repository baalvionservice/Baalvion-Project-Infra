'use client';

import { create } from 'zustand';
import type { AuthUser } from '@/lib/types/auth.types';
import type { OrgSummary } from '@/lib/types/organization.types';

/**
 * Auth store — IN-MEMORY ONLY (P0 remediation).
 *
 * The `persist` middleware (which wrote the access token + user to localStorage) has been
 * REMOVED. The access token lives only in this store's memory for the lifetime of the tab.
 * On reload the store resets and AuthProvider re-hydrates via a silent cookie refresh
 * (httpOnly `baalvion_refresh`). `isHydrated` flips true once that bootstrap has run.
 */
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  expiresAt: number | null;
  currentOrg: OrgSummary | null;
  orgs: OrgSummary[];
  isHydrated: boolean;

  setAuth: (user: AuthUser, token: string, expiresIn: number, org: OrgSummary | null) => void;
  setTokens: (token: string, expiresIn: number) => void;
  setUser: (user: AuthUser) => void;
  setCurrentOrg: (org: OrgSummary) => void;
  setOrgs: (orgs: OrgSummary[]) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  expiresAt: null,
  currentOrg: null,
  orgs: [],
  isHydrated: false,

  setAuth: (user, token, expiresIn, org) =>
    set({
      user,
      accessToken: token,
      expiresAt: Date.now() + expiresIn * 1000,
      currentOrg: org,
    }),

  setTokens: (token, expiresIn) =>
    set({
      accessToken: token,
      expiresAt: Date.now() + expiresIn * 1000,
    }),

  setUser: (user) => set({ user }),

  setCurrentOrg: (org) => set({ currentOrg: org }),

  setOrgs: (orgs) => set({ orgs }),

  setHydrated: (v) => set({ isHydrated: v }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      expiresAt: null,
      currentOrg: null,
      orgs: [],
    }),

  isAuthenticated: () => {
    const { accessToken, expiresAt } = get();
    return !!accessToken && !!expiresAt && Date.now() < expiresAt;
  },

  isTokenExpired: () => {
    const { expiresAt } = get();
    if (!expiresAt) return true;
    return Date.now() >= expiresAt - 60_000;
  },
}));
