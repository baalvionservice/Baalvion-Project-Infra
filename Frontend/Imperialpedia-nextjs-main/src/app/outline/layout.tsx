import React from 'react';
import { RoleGate } from '@/components/auth/RoleGate';

/**
 * The AI Content Outline tool is internal editorial tooling, not reader content —
 * it has no reason to be reachable by anonymous visitors or search crawlers.
 * `middleware.ts` blocks anonymous requests on the session cookie; RoleGate
 * restricts it to the same roles that can author content (see editor/writer
 * layouts for the identical pattern).
 */
export default function OutlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate allow={['admin', 'editor', 'writer']}>{children}</RoleGate>
  );
}
