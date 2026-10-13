'use client';

/**
 * @file dashboard-kit.tsx
 * @description Small building blocks for the buyer and seller dashboards: a page header, stat
 * cards that load and fail on their own, panels, empty states and an inline error.
 *
 * Design rules these enforce, so every dashboard reads the same way on a phone, an iPad and a desk:
 *  - plain words, sentence case, text never smaller than 12px (body copy 14px and up);
 *  - every tap target is at least 44px tall;
 *  - layouts stack to one column on phones and open up with width, never scroll sideways;
 *  - a card that cannot load says so and offers "Try again", it never shows a fake zero.
 */

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type IconType = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {actions && <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:flex sm:flex-wrap lg:justify-end">{actions}</div>}
    </header>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</section>;
}

interface StatCardProps {
  label: string;
  /** Already formatted. Shown only when `status` is "ready". */
  value?: string;
  hint?: string;
  icon: IconType;
  /** Where tapping the card goes. */
  href?: string;
  status: 'loading' | 'ready' | 'error';
  onRetry?: () => void;
  tone?: string;
}

export function StatCard({ label, value, hint, icon: Icon, href, status, onRetry, tone = 'text-primary' }: StatCardProps) {
  const body = (
    <CardContent className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon aria-hidden className={cn('h-5 w-5 shrink-0', tone)} />
      </div>
      {status === 'loading' && (
        <div role="status" aria-label={`Loading ${label}`} className="mt-3 space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
      )}
      {status === 'ready' && (
        <>
          <p className="mt-2 text-3xl font-semibold tabular-nums leading-none">{value}</p>
          {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
        </>
      )}
      {status === 'error' && (
        <div role="alert" className="mt-2 text-sm">
          <p className="text-muted-foreground">Couldn&apos;t load this.</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <RefreshCw aria-hidden className="h-4 w-4" /> Try again
            </button>
          )}
        </div>
      )}
    </CardContent>
  );

  const card = <Card className="h-full transition-colors hover:bg-accent/40">{body}</Card>;
  // A link wraps the card only when there is a number to follow. An error card holds a button, and a
  // button inside a link is invalid and unreliable on touch screens.
  if (href && status !== 'error') {
    return (
      <Link href={href} className="block h-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {card}
      </Link>
    );
  }
  return <Card className="h-full">{body}</Card>;
}

export function Panel({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: IconType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon aria-hidden className="h-6 w-6 text-muted-foreground" />
      </span>
      <p className="text-base font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center">
      <AlertCircle aria-hidden className="h-5 w-5 shrink-0 text-destructive" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
          <RefreshCw aria-hidden className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

/** A loading placeholder for a whole panel body. */
export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
