import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Institutional Voting Center | Governance',
  description: 'Review and cast your votes on key corporate resolutions and board appointments as a Baalvion institutional investor.',
};

export default function MyVotingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
