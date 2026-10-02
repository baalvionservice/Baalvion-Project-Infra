import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import AccessGate from '@/components/authz/AccessGate';
import RealtimeProvider from '@/providers/RealtimeProvider';

export const metadata: Metadata = {
  title: { template: '%s | Baalvion Admin', default: 'Baalvion Admin' },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <AppShell>
        {/* One gate for every dashboard route, driven by lib/authz/policy.ts — a section
            added without its own layout gate can no longer be opened by typing the URL. */}
        <AccessGate>{children}</AccessGate>
      </AppShell>
    </RealtimeProvider>
  );
}
