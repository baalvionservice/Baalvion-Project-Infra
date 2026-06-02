
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
    logout,
    impersonating,
    startImpersonation,
    stopImpersonation,
  } = useAuthContext();

  return {
    user,
    role,
    loading,
    profile: null,       // not yet wired to AuthContext
    profileStatus: null, // not yet wired to AuthContext
    subscriptionTier: null, // not yet wired to AuthContext
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
