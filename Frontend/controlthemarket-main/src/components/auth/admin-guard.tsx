'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

/**
 * Role gate for the /admin surface.
 *
 * The auth context already bounces signed-OUT visitors off non-public paths, and the edge
 * middleware checks the refresh cookie — but neither looks at the role. So any authenticated
 * candidate or company account could open the admin console simply by typing /admin.
 *
 * `role` here is the mapped app role from mapRoles(), which already reads the token's roles[]
 * and collapses admin / super_admin / platform_admin to 'admin'.
 *
 * UX gate, not the security boundary — the API stays authoritative on every request.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const denied = !loading && !!user && user.role !== 'admin';

  useEffect(() => {
    // Signed-out is already handled by the auth context; only bounce the wrong-role case,
    // and send them to their own dashboard rather than a dead end.
    if (denied) router.replace(`/${user.role}/dashboard`);
  }, [denied, user, router]);

  // Render nothing until the role is known, so admin content never flashes first.
  if (loading || !user || denied) return null;

  return <>{children}</>;
}
