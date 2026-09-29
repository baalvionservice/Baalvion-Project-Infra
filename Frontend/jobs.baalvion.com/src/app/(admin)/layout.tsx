import type { Metadata } from 'next';
import AdminLayout from '@/components/layout/AdminLayout';

// Private admin console — never index or follow. robots.ts also disallows
// /admin/, but this segment-level directive guarantees noindex even if a page
// is reached via a non-disallowed path.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// In-app admin panel. Renders the role-guarded admin shell (sidebar + topbar)
// so administrators can see everything happening — recruitment pipeline, campus
// placements, and college/student onboarding applications — in one console.
//
// To centralize administration in the external Baalvion admin-platform console
// instead, set NEXT_PUBLIC_ADMIN_CONSOLE_URL and redirect from here.
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
