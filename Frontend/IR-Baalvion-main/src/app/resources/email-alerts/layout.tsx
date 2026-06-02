import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Investor Email Alerts | Resources',
  description: 'Subscribe to Baalvion investor email alerts for financial reporting, board resolutions, and data room activity updates.',
};

export default function EmailAlertsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
