'use client';

import { useAppStore } from '@/lib/store';
import { canPerform } from '@/lib/permissions/core';

/**
 * @fileOverview React hook for real-time permission checks and UI visibility.
 */
export function usePermissions() {
  const { currentUser } = useAppStore();

  return {
    /**
     * Functional permission check.
     */
    can: (permission: string, country?: string) =>
      canPerform(currentUser, permission, country),
    
    /**
     * UI Visibility alias for cleaner template logic.
     */
    showIf: (permission: string, country?: string) =>
      canPerform(currentUser, permission, country),
    
    user: currentUser,
    isSuperAdmin: currentUser?.role === 'super_admin'
  };
}
