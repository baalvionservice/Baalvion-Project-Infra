import type { Metadata } from 'next';
import { AdminGuard } from '@/components/auth/admin-guard';

// Private, authenticated admin surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Was a bare passthrough: nothing here checked the caller's role, so any authenticated
  // candidate or company account could open the admin console by typing the URL.
  return <AdminGuard>{children}</AdminGuard>;
}
