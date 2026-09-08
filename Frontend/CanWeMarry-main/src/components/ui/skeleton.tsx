import { cn } from './cn';

/**
 * A placeholder shaped like the thing that is loading.
 *
 * Deliberately still — no shimmer sweep. A pulsing gradient across a whole page reads as
 * urgency, which is the wrong register here, and it is one more thing moving on a screen
 * somebody may be reading with a family member nearby. The reduced-motion rule in
 * globals.css would flatten an animation anyway, so this is what most people would see.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block rounded-md bg-surface-2', className)} />;
}

/** A card-shaped placeholder, matching the real card's padding and line rhythm. */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/5" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('mt-2 h-3.5', i === lines - 1 ? 'w-4/5' : 'w-full')} />
      ))}
      <Skeleton className="mt-4 h-3 w-2/5" />
    </div>
  );
}

/**
 * A loading grid or list. The live region announces once; the cards themselves are hidden
 * from assistive technology, since a screen reader gains nothing from a description of
 * grey boxes.
 */
export function SkeletonList({ count = 6, columns = 1, label = 'Loading' }: { count?: number; columns?: 1 | 2 | 3; label?: string }) {
  const grid = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-2 xl:grid-cols-3' }[columns];
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className={cn('grid gap-4', grid)}>
        {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
