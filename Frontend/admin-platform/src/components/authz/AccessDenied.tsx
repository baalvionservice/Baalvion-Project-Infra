'use client';

import Link from 'next/link';
import { ShieldX, LifeBuoy, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DenyReason } from '@/lib/authz/access';

interface AccessDeniedProps {
  reason?: DenyReason;
  /** What the section requires, e.g. "Administrators". */
  required?: string;
  /** Section name, for a message that says something specific. */
  section?: string;
}

/**
 * The screen a user meets instead of a page full of 403s.
 *
 * Previously the console rendered the real page for anyone signed in; every query then failed
 * against the backend's guards, leaving a broken shell that still exposed the section's name,
 * layout and sub-navigation. This says plainly what happened and what to do next.
 */
export default function AccessDenied({ reason = 'role', required, section }: AccessDeniedProps) {
  // A user whose roles the backend hierarchy doesn't recognise is OUR misconfiguration —
  // telling them "ask for a higher role" would send them on a pointless errand.
  const isMisconfiguration = reason === 'unmapped-role';

  const title = isMisconfiguration ? 'Your account needs setup' : 'You don’t have access';

  const body = isMisconfiguration
    ? 'Your account carries a role that isn’t connected to any permissions yet, so nothing here will load. This is a configuration issue on our side, not something you did wrong.'
    : section
      ? `${section} is limited to ${required ?? 'users with additional permissions'}.`
      : `This section is limited to ${required ?? 'users with additional permissions'}.`;

  return (
    <Card className="mx-auto max-w-lg border-dashed">
      <CardContent className="flex flex-col items-center gap-4 px-8 py-16 text-center">
        {isMisconfiguration ? (
          <AlertTriangle className="h-10 w-10 text-amber-500" aria-hidden="true" />
        ) : (
          <ShieldX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        )}

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button asChild variant="default" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/support">
              <LifeBuoy className="mr-1.5 h-3.5 w-3.5" />
              Request access
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
