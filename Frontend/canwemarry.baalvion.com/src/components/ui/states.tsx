import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * The three states every data surface needs. They are one file because they share a shape
 * and because keeping them together makes it obvious when a page has handled only one of
 * them — a list that renders nothing on an error looks identical to an empty one.
 */

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Heading level. Defaults to h2, the usual level directly beneath a page title. */
  as?: 'h2' | 'h3';
}

export function EmptyState({ title, description, action, className, as: Heading = 'h2' }: EmptyStateProps) {
  return (
    <div className={cn('rounded-card border border-dashed border-line-strong bg-surface/50 px-6 py-12 text-center', className)}>
      <Heading className="heading text-base">{title}</Heading>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading', rows = 3, className }: { label?: string; rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-card border border-line bg-surface p-5">
          <div className="h-4 w-2/5 rounded bg-surface-2" />
          <div className="mt-3 h-3 w-full rounded bg-surface-2" />
          <div className="mt-2 h-3 w-4/5 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  /** Shown small; useful when someone quotes a failure to support. */
  requestId?: string;
  action?: ReactNode;
  className?: string;
  /** Heading level. Defaults to h2; pass h1 when this IS the page's only heading. */
  as?: 'h1' | 'h2' | 'h3';
}

export function ErrorState({
  title = 'That did not load', message, requestId, action, className, as: Heading = 'h2',
}: ErrorStateProps) {
  return (
    <div className={cn('rounded-card border border-danger/30 bg-danger/5 px-6 py-8 text-center', className)} role="alert">
      <Heading className={cn('heading', Heading === 'h1' ? 'text-2xl' : 'text-base')}>{title}</Heading>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      {requestId && <p className="mt-3 text-xs text-muted-2">Reference: {requestId}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
