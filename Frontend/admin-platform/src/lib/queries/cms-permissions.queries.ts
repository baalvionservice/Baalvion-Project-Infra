'use client';

import { useWebsiteMembers } from '@/lib/queries/cms-websites.queries';
import { useAuthStore } from '@/lib/store/authStore';
import { resolveCmsPermissions, type CmsPermissions } from '@/lib/cms/permissions';

/**
 * Resolve the current user's CMS permissions for a website without pulling the full
 * platform-user index (lighter than useCmsUsers). Platform admins are treated as CMS
 * admins even without a membership row.
 */
export function useCmsPermissions(canonicalId: string): CmsPermissions {
  const authUser = useAuthStore((s) => s.user);
  const { data: members } = useWebsiteMembers(canonicalId);
  const myRole = (members ?? []).find((m) => m.userId === authUser?.id)?.cmsRole ?? null;
  return resolveCmsPermissions({ myRole, platformRole: authUser?.role ?? null });
}
