
'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/contracts';
import { authServerService, getPortalProfile } from '@/services/adapters/server/auth.server';

// Map backend role strings to portal UserRole enum
function normalizeRole(raw: string): UserRole {
  const upper = raw.toUpperCase();
  const roleMap: Record<string, UserRole> = {
    OWNER:       'SUPER_ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN:       'ADMIN',
    MANAGER:     'ADMIN',
    RECRUITER:   'RECRUITER',
    INTERVIEWER: 'INTERVIEWER',
    FINANCE:     'FINANCE',
    CONTRACTOR:  'CONTRACTOR',
    CLIENT:      'CLIENT',
    CANDIDATE:   'CANDIDATE',
    MEMBER:      'CANDIDATE',
    VIEWER:      'CANDIDATE',
  };
  return roleMap[upper] ?? 'CANDIDATE';
}

export const useAuth = () => {
  const { user, isLoading, setTokens, clearAuth, setIsLoading, setRole } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authServerService.login(email, password);

      if (!res.success || !res.data) {
        throw new Error(res.error ?? 'Login failed');
      }

      // Backend shape: { token, user: { id, name, email, ... } }
      const raw = res.data as Record<string, unknown>;
      const token = (raw.token ?? raw.accessToken ?? '') as string;
      const backendUser = (raw.user ?? raw.data ?? raw) as Record<string, unknown>;

      // The real portal role + candidateId come from the jobs-service (auth only says "owner").
      const profile = await getPortalProfile();

      const portalUser = {
        id:        String(profile?.userId ?? backendUser.id ?? ''),
        name:      (profile?.name ?? backendUser.name ?? backendUser.fullName ?? email) as string,
        fullName:  (profile?.name ?? backendUser.name ?? backendUser.fullName ?? email) as string,
        email:     (profile?.email ?? backendUser.email ?? email) as string,
        avatarUrl: (backendUser.avatarUrl ?? '') as string,
        role:      normalizeRole(String(profile?.role ?? backendUser.role ?? 'CANDIDATE')),
        candidateId: profile?.candidateId ?? null,
        isActive:  true,
        createdAt: (backendUser.createdAt ?? new Date().toISOString()) as string,
        updatedAt: (backendUser.updatedAt ?? new Date().toISOString()) as string,
      };

      setTokens(portalUser, token);
      router.push(portalUser.role === 'CANDIDATE' ? '/my-account' : '/dashboard');
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      const res = await authServerService.register(email, password, fullName);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Registration failed');
      const token = (res.data as Record<string, unknown>).token as string;
      const profile = await getPortalProfile();
      const portalUser = {
        id:        String(profile?.userId ?? ''),
        name:      (profile?.name ?? fullName ?? email) as string,
        fullName:  (profile?.name ?? fullName ?? email) as string,
        email:     (profile?.email ?? email) as string,
        avatarUrl: '',
        role:      normalizeRole(String(profile?.role ?? 'CANDIDATE')),
        candidateId: profile?.candidateId ?? null,
        isActive:  true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTokens(portalUser, token);
      router.push(portalUser.role === 'CANDIDATE' ? '/my-account' : '/dashboard');
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authServerService.logout();
    } catch { /* best-effort */ }
    clearAuth();
    router.push('/login');
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    setRole,
    isAuthenticated: !!user,
    role: user?.role,
  };
};
