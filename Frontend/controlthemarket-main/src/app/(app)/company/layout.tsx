import type { Metadata } from 'next';

// Private, authenticated company surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CompanySegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
