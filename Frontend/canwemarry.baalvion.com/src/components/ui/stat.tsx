import { cn } from './cn';

/**
 * A single counted fact.
 *
 * Every number rendered through this comes from a server count. There is no place to pass
 * an estimate, and nothing here rounds "0" up to something friendlier — an empty community
 * that claims members is the same category of dishonesty as a fabricated testimonial.
 */
export function Stat({ value, label, className }: { value: number | string; label: string; className?: string }) {
  return (
    <div className={cn('rounded-card border border-line bg-surface px-4 py-3', className)}>
      <p className="font-display text-2xl tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

/** Inline counts for a card footer, joined with separators. */
export function StatLine({ items, className }: { items: (string | null | false | undefined)[]; className?: string }) {
  const shown = items.filter(Boolean) as string[];
  if (shown.length === 0) return null;
  return <p className={cn('text-xs text-muted-2', className)}>{shown.join(' · ')}</p>;
}
