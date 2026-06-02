'use client';

import { useMemo } from 'react';
import { useUsers } from '@/lib/queries/users.queries';
import type { AdminUser } from '@/lib/types/user.types';

/**
 * Resolves an RBAC assignment's `userId` (a string) to a display user. RBAC stores only the
 * id; the directory (admin-service) is the read-only source for email/name. Read-only metadata.
 */
export function useUserDirectory() {
  const { data, isLoading } = useUsers({ limit: 200 });

  const byId = useMemo(() => {
    const map = new Map<string, AdminUser>();
    for (const user of data?.data ?? []) map.set(String(user.id), user);
    return map;
  }, [data]);

  const resolve = (userId: string): AdminUser | undefined => byId.get(String(userId));

  return { resolve, isLoading };
}
