'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/lib/types/auth.types';
import type { OrgSummary } from '@/lib/types/organization.types';

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
  logout: () => void;
  isAuthenticated: () => boolean;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'baalvion-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt,
        currentOrg: state.currentOrg,
        orgs: state.orgs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    },
  ),
);
