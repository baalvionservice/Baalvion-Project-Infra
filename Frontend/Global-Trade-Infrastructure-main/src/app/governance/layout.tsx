/**
 * @file governance/layout.tsx
 * @description Server shell for all consolidated governance and oversight pages.
 * Rendered dynamically per-request (auth-gated, store-driven) — kept as a Server
 * Component solely so this route segment config can live here instead of forcing
 * the whole app to skip static/ISR caching. Actual UI lives in
 * `_components/governance-shell.tsx`.
 */
import { GovernanceShell } from './_components/governance-shell';

export const dynamic = 'force-dynamic';

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <GovernanceShell>{children}</GovernanceShell>;
}
