import type { Metadata } from 'next';

// Private, role-guarded dashboards (/dashboard/client, /dashboard/contractor).
// These are authenticated app surfaces, not public content — never index or
// follow. robots.ts also disallows /dashboard/; this server layout adds a
// segment-level noindex directive that the client sub-layouts cannot declare.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
