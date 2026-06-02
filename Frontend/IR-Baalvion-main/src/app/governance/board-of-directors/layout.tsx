import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Board of Directors | Baalvion Governance',
  description: 'Meet the Baalvion Board of Directors — experienced leaders overseeing corporate governance, strategy, and shareholder value.',
};

export default function BoardOfDirectorsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
