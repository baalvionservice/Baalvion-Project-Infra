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
import { RouteGuard } from './_components/route-guard';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // RouteGuard wraps the shell rather than sitting inside it: its curtain is full-screen by
  // design, and a denied user must not see the navigation rail of a console they cannot use.
  //
  // It had been written but never mounted — no page under (dashboard) imported it — so the
  // edge middleware's session check was the only gate, and its own comment ("per-authority
  // checks happen in the RouteGuard") described something that was not running. Any signed-in
  // user could reach every operational surface here by typing the URL.
  //
  // The API remains the security boundary; this stops privileged screens rendering at all.
  return (
    <RouteGuard>
      <DashboardShell>{children}</DashboardShell>
    </RouteGuard>
  );
}
