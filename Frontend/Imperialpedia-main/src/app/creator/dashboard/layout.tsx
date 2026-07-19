import React from 'react';
import { RoleGate } from '@/components/auth/RoleGate';

/**
 * `middleware.ts` already blocks anonymous requests to `/creator/dashboard/*` on the
 * session cookie. This adds the missing per-role check (this layout did not exist
 * before — any signed-in account could reach another creator's dashboard shell).
 */
export default function CreatorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGate allow={['admin', 'creator']}>{children}</RoleGate>;
}
