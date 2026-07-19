import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Container } from '@/design-system/layout/container';
import { RoleGate } from '@/components/auth/RoleGate';

/**
 * Specialized layout for the Editor Dashboard.
 * Provides a persistent sidebar for managing the review queue.
 *
 * `middleware.ts` already blocks anonymous requests on the session cookie; the
 * RoleGate below enforces that only editor/admin accounts can see this section at
 * all (previously ANY signed-in reader could reach it).
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate allow={['admin', 'editor']}>
      <div className="flex min-h-screen bg-background">
        {/* Persistent Editorial Sidebar */}
        <Sidebar className="hidden lg:flex sticky top-0 h-screen" />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Container className="max-w-7xl">
              {children}
            </Container>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
