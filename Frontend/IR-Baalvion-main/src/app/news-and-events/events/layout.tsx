import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  // Without this the page inherits the root layout's canonical ('/') and tells crawlers it is
  // a duplicate of the homepage.
  alternates: { canonical: '/news-and-events/events' },
  title: 'Events & Presentations | News and Events',
  description: 'Upcoming and archived Baalvion investor events, earnings calls, conferences, and presentations.',
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
