import type { ReactNode } from 'react';
import AccessGate from '@/components/authz/AccessGate';

// Access rule lives in lib/authz/policy.ts — one map for the whole console, mirroring the
// guards auth-node actually enforces. Backend remains the authority; this stops the console
// rendering a section whose every request would 403.
export default function DevelopersLayout({ children }: { children: ReactNode }) {
  return <AccessGate section="Developer Platform">{children}</AccessGate>;
}
