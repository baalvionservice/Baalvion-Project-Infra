'use client';

import type { ReactNode } from 'react';
import { usePermission } from '@/lib/hooks/usePermission';
import type { UserRole } from '@/lib/types/auth.types';
import type { ActionType, ResourceType } from '@/lib/types/common.types';

interface PermissionGuardProps {
  children: ReactNode;
  resource?: ResourceType;
  action?: ActionType;
  minRole?: UserRole;
  fallback?: ReactNode;
}

export default function PermissionGuard({
  children,
  resource,
  action,
  minRole,
  fallback = null,
}: PermissionGuardProps) {
  const { can, isAtLeast } = usePermission();

  let allowed = true;

  if (resource && action) {
    allowed = can(resource, action);
  }

  if (minRole) {
    allowed = allowed && isAtLeast(minRole);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
