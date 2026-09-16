import type { Metadata } from 'next';

// The page itself is a client component and cannot export metadata, so it lives here.
export const metadata: Metadata = {
  title: 'Performance',
  description: 'Baalvion administration.',
  // Gated: a crawler only ever sees a sign-in wall here, so keep it out of the index entirely.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
