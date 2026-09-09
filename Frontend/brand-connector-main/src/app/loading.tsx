import { Skeleton } from '@/components/ui/skeleton';

// Route-level loading state. Mirrors the homepage hero — same gradient, same
// min-h-[90vh] container and two-column grid — so the real page swaps in
// without shifting. Placeholders are tinted to the dark hero, since the
// default bg-muted is a light-surface value.
export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section
          className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#4c1d95] via-[#312e81] to-[#1e1b4b] py-12 lg:py-0"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">Loading</span>
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col space-y-8">
                <Skeleton className="h-9 w-64 rounded-full bg-white/10" />
                <div className="space-y-3">
                  <Skeleton className="h-12 sm:h-16 xl:h-20 w-full bg-white/10" />
                  <Skeleton className="h-12 sm:h-16 xl:h-20 w-4/5 bg-white/10" />
                </div>
                <div className="max-w-[600px] space-y-3">
                  <Skeleton className="h-5 w-full bg-white/10" />
                  <Skeleton className="h-5 w-11/12 bg-white/10" />
                  <Skeleton className="h-5 w-2/3 bg-white/10" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-14 w-full sm:w-52 rounded-full bg-white/10" />
                  <Skeleton className="h-14 w-full sm:w-52 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative z-20 rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-md shadow-2xl">
                  <Skeleton className="aspect-[16/10] w-full rounded-xl bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
