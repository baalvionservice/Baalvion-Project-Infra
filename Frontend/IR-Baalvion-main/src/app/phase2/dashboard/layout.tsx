import type { Metadata } from 'next';

// Gated portal: a crawler only ever reaches a sign-in wall, so keep it out of the index.
export const metadata: Metadata = {
  title: 'SPV Dashboard',
  description: 'Phase 2 SPV dashboard.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
