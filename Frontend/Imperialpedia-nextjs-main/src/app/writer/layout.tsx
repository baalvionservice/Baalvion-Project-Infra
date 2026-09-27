import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Container } from '@/design-system/layout/container';
import { RoleGate } from '@/components/auth/RoleGate';

/**
 * Specialized layout for the Writer Dashboard.
 *
 * RoleGate restricts this section to accounts that actually write/edit content
 * (previously any signed-in reader could reach it — see mock-data remediation report).
 */
export default function WriterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate allow={['admin', 'editor', 'writer', 'creator']}>
      <div className="flex min-h-screen bg-background">
        {/* Fixed Sidebar for Writer Navigation */}
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
