'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import AccessDenied from './AccessDenied';
import { useAccess } from '@/lib/authz/useAccess';
import { useAuthzVersion } from '@/lib/authz/version';
import { policyFor } from '@/lib/authz/policy';
import type { AccessRequirement } from '@/lib/authz/access';

interface AccessGateProps {
  children: ReactNode;
  /**
   * Explicit requirement. Omit to use the route policy for the current pathname —
   * the normal case, so a section's rule lives in one place (lib/authz/policy.ts).
   */
  requirement?: AccessRequirement;
  /** Section name for the denial copy, e.g. "Payments". */
  section?: string;
  /** Render nothing instead of the denial screen — for inline bits, not whole routes. */
  silent?: boolean;
  fallback?: ReactNode;
}

/**
 * Route-level authorization gate.
 *
 * A UX gate, not the security boundary — the backend's guards remain the authority on every
 * read and mutation. Its job is to stop the console showing a section whose every request
 * will 403, and to say why in plain language.
 */
export default function AccessGate({
  children,
  requirement,
  section,
  silent = false,
  fallback,
}: AccessGateProps) {
  const pathname = usePathname() ?? '/';
  const { check, checkRoute, isReady } = useAccess();
  const authzVersion = useAuthzVersion();

  // Legacy mode reproduces the original console: no route gating at all, exactly as it
  // behaved before the policy engine. Hooks stay above this branch so the order is stable.
  const decision = requirement ? check(requirement) : checkRoute(pathname);
  if (authzVersion === 'old') return <>{children}</>;

  // The session bootstraps via a silent cookie refresh; denying before it lands would flash
  // "no access" at legitimate admins on every hard reload.
  if (!isReady) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Checking your access…
      </div>
    );
  }

  if (decision.allowed) return <>{children}</>;
  if (silent) return <>{fallback ?? null}</>;

  const required = decision.required ?? (requirement ?? policyFor(pathname))?.label;

  return <AccessDenied reason={decision.reason} required={required} section={section} />;
}
