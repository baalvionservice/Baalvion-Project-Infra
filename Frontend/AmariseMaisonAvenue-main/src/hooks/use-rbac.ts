'use client';

import { useAppStore } from '@/lib/store';
import { canPerform } from '@/lib/permissions/core';
import { Permission } from '@/lib/permissions/engine';

/**
 * @fileOverview Consolidated hook for access control and UI visibility checks.
 */
export function useRBAC() {
  const { currentUser } = useAppStore();

  return {
    user: currentUser,
    /**
     * Functional permission check.
     */
    can: (permission: string, country?: string) => {
      return canPerform(currentUser, permission, country);
    },
    /**
     * UI Visibility helper.
     */
    showIf: (permission: string, country?: string) => {
      return canPerform(currentUser, permission, country);
    },
    isSuperAdmin: currentUser?.role === 'super_admin'
  };
}
