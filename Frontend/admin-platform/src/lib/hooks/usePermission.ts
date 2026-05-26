'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { can, isAtLeast, isSuperAdmin } from '@/lib/utils/permissions';
import type { UserRole } from '@/lib/types/auth.types';
import type { ActionType, ResourceType } from '@/lib/types/common.types';

export const usePermission = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  return {
    can: (resource: ResourceType, action: ActionType) => can(role, resource, action),
    isAtLeast: (minRole: UserRole) => isAtLeast(role, minRole),
    isSuperAdmin: () => isSuperAdmin(role),
    role,
  };
};
