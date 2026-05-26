'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

const PUBLIC_PATHS = ['/login', '/mfa', '/forgot-password', '/reset-password'];

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, isTokenExpired } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const authenticated = isAuthenticated();

    if (!authenticated && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (authenticated && isPublic) {
      router.replace('/dashboard');
    }
  }, [isHydrated, pathname, router, isAuthenticated, isTokenExpired]);

  return <>{children}</>;
}
