/**
 * @file layout.tsx
 * @description Server shell for the authenticated, store-driven trade dashboard.
 * Rendered dynamically per-request rather than statically prerendered at build
 * (client stores are not SSG-safe). Kept as a Server Component solely so this
 * route segment config can live here instead of forcing the whole app —
 * including the public marketing pages under (public) — to skip static/ISR
 * caching. Actual UI lives in `_components/dashboard-shell.tsx`.
 */
import { DashboardShell } from './_components/dashboard-shell';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
