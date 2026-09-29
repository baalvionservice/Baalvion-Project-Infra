import type { Metadata } from 'next';

// Candidate self-service account area (/my-account/**) is private. The page and
// the (candidate) group layout are Client Components and cannot export
// metadata, so this server segment layout declares the noindex directive.
// robots.ts also disallows /my-account/.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MyAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
