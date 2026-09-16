import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';

/**
 * A single loading placeholder.
 *
 * Give it the shape of the thing it stands in for — a skeleton that matches the
 * final layout prevents the content jump that makes a page feel unfinished.
 */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cx('bv-skeleton', className)} {...rest} />;
}

/**
 * Placeholder lines for a block of text. The last line is short, the way real
 * paragraphs end — uniform bars read as a loading bar, not as text.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-2', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cx('h-4', i === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * Announces to assistive tech that a region is loading. Wrap a skeleton in this
 * so screen-reader users get the same signal sighted users get.
 */
export function LoadingRegion({
  label = 'Loading',
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

type StateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * The "nothing here yet" state.
 *
 * An empty region with no explanation is the single clearest tell of an
 * unfinished product, and this repo rendered bare `null` in most of them.
 * Always give the reader a reason and, where one exists, a next step.
 */
export function EmptyState({ title, description, icon, action, className }: StateProps) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 px-bv-gutter py-bv-section-sm text-center', className)}>
      {icon ? <div className="opacity-40">{icon}</div> : null}
      <p className="text-bv-h4">{title}</p>
      {description ? <p className="max-w-bv-prose text-bv-small opacity-70 bv-pretty">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/**
 * The failure state. Says what failed in the reader's terms; the stack trace
 * belongs in the logs, not on the page.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'The page could not be loaded. Try again in a moment.',
  icon,
  action,
  className,
}: Partial<StateProps>) {
  return (
    <div
      role="alert"
      className={cx('flex flex-col items-center justify-center gap-3 px-bv-gutter py-bv-section-sm text-center', className)}
    >
      {icon ? <div className="opacity-50">{icon}</div> : null}
      <p className="text-bv-h4">{title}</p>
      {description ? <p className="max-w-bv-prose text-bv-small opacity-70 bv-pretty">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
