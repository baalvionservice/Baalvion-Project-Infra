import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Investor Email Alerts | Baalvion Industries Private Limited',
  description: 'Sign up to receive Baalvion Industries Private Limited investor email alerts — press releases, financial results, events, regulatory filings and governance updates.',
  alternates: { canonical: '/resources/email-alerts' },
};

export default function EmailAlertsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
