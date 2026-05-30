
'use client';

import { useAuthContext } from '@/context/AuthContext';

/**
 * @fileOverview useAuth Hook
 * Streamlined access to the platform's authentication and role-based intelligence.
 */
export function useAuth() {
  const {
    user,
    role,
    loading,
    profile,
    profileStatus,
    subscriptionTier,
    logout,
    impersonating,
    startImpersonation,
    stopImpersonation,
  } = useAuthContext();

  return {
    user,
    role,
    loading,
    profile,
    profileStatus,
    subscriptionTier,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isLawyer: role === 'lawyer',
    isClient: role === 'client',
    logout,
    impersonating,
    startImpersonation,
    stopImpersonation,
    isImpersonating: !!impersonating,
  };
}
