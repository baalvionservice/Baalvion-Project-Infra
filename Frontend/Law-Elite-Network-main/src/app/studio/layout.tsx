import type { Metadata } from 'next';

// Staff tool: keep it out of search indexes (also disallowed in robots.ts).
export const metadata: Metadata = {
  title: 'Article Studio',
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
