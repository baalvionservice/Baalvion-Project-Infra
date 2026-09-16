import { Skeleton } from '@/components/ui/skeleton';

// Root fallback: it stands in for the whole (public) subtree, header included, so
// the h-20 bar below reserves the sticky header's height and the real page lands
// at the same offset.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen flex flex-col bg-background"
    >
      <span className="sr-only">Loading</span>

      <div className="container mx-auto flex h-20 items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="hidden md:block h-8 w-72" />
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="container mx-auto flex-1 py-16 lg:py-24 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-5 w-2/3" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-9 w-28 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
