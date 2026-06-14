import type { Metadata } from 'next';

// Private, authenticated admin surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
