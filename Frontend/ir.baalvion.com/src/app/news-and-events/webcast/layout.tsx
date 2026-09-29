import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Webcasts | News and Events',
  description: 'Live and on-demand Baalvion investor webcasts — earnings calls, conference presentations, and recorded sessions.',
  alternates: { canonical: '/news-and-events/webcast' },
};

export default function WebcastLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
