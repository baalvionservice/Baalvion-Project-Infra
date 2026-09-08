import type { Metadata } from 'next';

// The page itself is a client component and cannot export metadata, so it lives here.
export const metadata: Metadata = {
  title: 'My Deal Pipeline',
  description: 'Every opportunity you are progressing, from interest through to funding.',
  // Gated: a crawler only ever sees a sign-in wall here, so keep it out of the index entirely.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
