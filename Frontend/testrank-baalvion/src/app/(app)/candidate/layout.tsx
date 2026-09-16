import type { Metadata } from 'next';

// Private, authenticated candidate surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CandidateSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
