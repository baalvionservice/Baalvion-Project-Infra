import { Skeleton } from '@/components/ui/skeleton';

// Covers the standalone surfaces (/welcome, /invite, sign-in). Dashboard navigation
// resolves to the closer (dashboard)/loading.tsx, which keeps the shell on screen.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-muted/20 p-6"
    >
      <span className="sr-only">Loading</span>
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-8 shadow">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
