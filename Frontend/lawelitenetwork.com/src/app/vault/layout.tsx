import type { Metadata } from 'next';

// Private/authenticated surface — keep out of search indexes (also disallowed in robots.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}