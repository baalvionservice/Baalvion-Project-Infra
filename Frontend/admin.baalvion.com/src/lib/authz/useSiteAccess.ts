'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { websitesApi } from '@/lib/api/cms-websites';
import { canOpenSitePath, seesAllSites } from './siteScope';

/**
 * Which websites the signed-in user may open. cms-service returns only the caller's own
 * memberships from GET /cms/websites, so that list IS the allow-list.
 */
export function useSiteAccess() {
  const user = useAuthStore((s) => s.user);
  const roles = useMemo(() => user?.roles ?? [], [user]);
  const unrestricted = seesAllSites(roles);

  const { data } = useQuery({
    queryKey: ['authz', 'member-websites', user?.id],
    queryFn: async () => (await websitesApi.list({ limit: 100 })).data.data,
    enabled: !!user && !unrestricted,
    staleTime: 5 * 60 * 1000,
  });

  const memberOf = useMemo(
    () => (data ? new Set(data.flatMap((w) => [w.slug, w.id])) : null),
    [data],
  );

  const canOpen = useCallback(
    (pathname: string) => canOpenSitePath(pathname, roles, memberOf),
    [roles, memberOf],
  );

  return { canOpen };
}
