import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Events & Presentations | News and Events',
  description: 'Upcoming and archived Baalvion investor events, earnings calls, conferences, and presentations.',
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
