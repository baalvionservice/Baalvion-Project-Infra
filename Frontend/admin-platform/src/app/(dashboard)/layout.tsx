import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AppShell from '@/components/layout/AppShell';
import RealtimeProvider from '@/providers/RealtimeProvider';

export const metadata: Metadata = {
  title: { template: '%s | Baalvion Admin', default: 'Baalvion Admin' },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RealtimeProvider>
      <AppShell>{children}</AppShell>
    </RealtimeProvider>
  );
}
