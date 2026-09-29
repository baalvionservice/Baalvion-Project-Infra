import type { Metadata } from 'next';

// The page itself is a client component and cannot export metadata, so it lives here.
export const metadata: Metadata = {
  title: 'My Business',
  description: 'Your listing, your rounds and the investors who have opened a room.',
  // Gated: a crawler only ever sees a sign-in wall here, so keep it out of the index entirely.
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
