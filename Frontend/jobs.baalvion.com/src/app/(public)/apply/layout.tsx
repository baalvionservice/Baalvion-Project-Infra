import type { Metadata } from 'next';

// The application funnel (/apply/[id]) is transactional, not content. The page
// itself is a Client Component and cannot export metadata, so this server
// segment layout declares the noindex directive. robots.ts also disallows
// /apply/.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
