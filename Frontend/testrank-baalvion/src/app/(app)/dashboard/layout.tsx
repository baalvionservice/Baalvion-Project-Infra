import type { Metadata } from 'next';

// Private, authenticated dashboard redirect surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
