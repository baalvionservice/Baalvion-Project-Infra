import { Skeleton } from "@/components/ui/skeleton";

// Every top-level section repeats the same sidebar + header shell in its own layout,
// so the root fallback draws that shell rather than a bare page — otherwise the chrome
// vanishes on every cross-section navigation.
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-screen"
    >
      <span className="sr-only">Loading</span>

      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <div className="flex h-16 items-center gap-3 px-4">
          <Skeleton className="h-8 w-8 rounded bg-sidebar-accent" />
          <Skeleton className="h-4 w-28 bg-sidebar-accent" />
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full bg-sidebar-accent" />
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2 px-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-9 w-56 sm:block" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-7 w-28" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 lg:col-span-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-6 h-[280px] w-full" />
            </div>
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
