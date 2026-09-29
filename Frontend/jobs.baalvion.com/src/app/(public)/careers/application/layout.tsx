import type { Metadata } from 'next';

// Multi-step job application funnel (/careers/application/**) is transactional,
// not content. The inner [slug] layout and its pages are Client Components and
// cannot export metadata, so this server segment layout declares noindex.
// robots.ts also disallows /careers/application/.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ApplicationFunnelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
