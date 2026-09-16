import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../cx';

type DivProps = HTMLAttributes<HTMLDivElement>;

/**
 * Page-width wrapper with the shared responsive gutter.
 *
 * Replaces the `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` incantation that was
 * copy-pasted (and drifted) across every app.
 */
export function Container({
  className,
  width = 'page',
  ...rest
}: DivProps & { width?: 'page' | 'prose' | 'full' }) {
  const widths = {
    page:  'max-w-bv-page',
    prose: 'max-w-bv-prose',
    full:  'max-w-none',
  } as const;
  return <div className={cx('mx-auto w-full px-bv-gutter', widths[width], className)} {...rest} />;
}

/**
 * A band of content with the shared vertical rhythm. `tight` for stacked
 * sections that would otherwise double up their whitespace.
 */
export function Section({
  className,
  as: Tag = 'section',
  tight = false,
  ...rest
}: DivProps & { as?: ElementType; tight?: boolean }) {
  return <Tag className={cx(tight ? 'py-bv-section-sm' : 'py-bv-section', className)} {...rest} />;
}

/** Body copy held to a readable measure (68ch) rather than running full-bleed. */
export function Prose({ className, ...rest }: DivProps) {
  return <div className={cx('max-w-bv-prose text-bv-body bv-pretty', className)} {...rest} />;
}

/** The small-caps label that sits above a heading. */
export function Overline({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx('bv-overline opacity-70', className)} {...rest} />;
}

/**
 * A figure with its label. Numerals are tabular so a row of these lines up
 * instead of jittering — the detail that separates a real dashboard from a mock.
 */
export function Stat({
  value,
  label,
  hint,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <span className="text-bv-h2 bv-tnum">{value}</span>
      <span className="bv-overline opacity-70">{label}</span>
      {hint ? <span className="text-bv-caption opacity-60">{hint}</span> : null}
    </div>
  );
}
