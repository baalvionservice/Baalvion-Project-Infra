'use client';

// Joins CMS website members (the source of truth for who has access + their CMS role)
// with the platform identity record (status, last login, created date). CMS members ARE
// platform users — keyed by the same numeric userId — so account-level actions
// (suspend / unsuspend / reset password) reuse the real identity-admin + auth backends.

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWebsiteMembers, websiteKeys } from '@/lib/queries/cms-websites.queries';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { resolveCmsPermissions, type CmsPermissions } from '@/lib/cms/permissions';
import type { CmsRole } from '@/lib/types/cms-website.types';

export type CmsUserStatus = 'active' | 'suspended' | 'pending';

export interface CmsUser {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  cmsRole: CmsRole;
  status: CmsUserStatus;
  lastLoginAt: string | null;
  createdAt: string; // platform created_at, falls back to membership joinedAt
  joinedAt: string;
}

export interface CmsUsersResult {
  users: CmsUser[];
  isLoading: boolean;
  permissions: CmsPermissions;
  counts: { total: number; active: number; suspended: number; byRole: Record<string, number> };
}

/**
 * Resolve the full Users table for a website.
 * @param websiteId route segment (slug/uuid) used for member mutations
 * @param canonicalId resolved UUID used for member + platform queries
 */
export function useCmsUsers(canonicalId: string): CmsUsersResult {
  const authUser = useAuthStore((s) => s.user);
  const members = useWebsiteMembers(canonicalId);

  // Platform users carry status / lastLoginAt / createdAt. One bounded fetch, mapped by id.
  const platform = useQuery({
    queryKey: ['cms-users', 'platform-index'],
    queryFn: () => usersApi.list({ limit: 200 }).then((r) => r.data.data),
    staleTime: 60_000,
  });

  return useMemo<CmsUsersResult>(() => {
    const team = members.data ?? [];
    const byId = new Map((platform.data ?? []).map((u) => [u.id, u]));

    const users: CmsUser[] = team.map((m) => {
      const p = byId.get(m.userId);
      return {
        userId: m.userId,
        fullName: m.user.fullName || p?.fullName || '—',
        email: m.user.email || p?.email || '—',
        avatarUrl: m.user.avatarUrl ?? p?.avatarUrl ?? null,
        cmsRole: m.cmsRole,
        status: (p?.status ?? 'active') as CmsUserStatus,
        lastLoginAt: p?.lastLoginAt ?? null,
        createdAt: p?.createdAt ?? m.joinedAt,
        joinedAt: m.joinedAt,
      };
    });

    const myRole = team.find((m) => m.userId === authUser?.id)?.cmsRole ?? null;
    const permissions = resolveCmsPermissions({ myRole, platformRole: authUser?.role ?? null });

    const byRole: Record<string, number> = {};
    users.forEach((u) => {
      byRole[u.cmsRole] = (byRole[u.cmsRole] ?? 0) + 1;
    });

    return {
      users,
      isLoading: members.isLoading,
      permissions,
      counts: {
        total: users.length,
        active: users.filter((u) => u.status === 'active').length,
        suspended: users.filter((u) => u.status === 'suspended').length,
        byRole,
      },
    };
  }, [members.data, members.isLoading, platform.data, authUser?.id, authUser?.role]);
}

// Suspend / unsuspend hit identity-admin (real, account-level) and invalidate both the
// platform index and the website members list so the table reflects status immediately.
export const useSuspendCmsUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      usersApi.suspend(userId, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-users', 'platform-index'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User suspended');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

export const useUnsuspendCmsUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => usersApi.unsuspend(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-users', 'platform-index'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User reactivated');
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
};

// Reset password = trigger the standard account-recovery email via the auth backend.
export const useResetCmsUserPassword = () =>
  useMutation({
    mutationFn: (email: string) => authApi.forgotPassword({ email }),
    onSuccess: () => toast.success('Password reset link sent'),
    onError: (e: { message: string }) => toast.error(e.message),
  });

// Re-export so the page can invalidate member queries after invite/role/remove.
export { websiteKeys };
