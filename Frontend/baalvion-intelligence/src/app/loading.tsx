// Root fallback. It stands in for the marketing layout too, so the h-16 bar keeps the
// navbar's height reserved and the real page lands at the same offset.
export default function Loading() {
  return (
    <div id="main-content" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>

      <div className="border-b border-border/80">
        <div className="section-container flex h-16 items-center justify-between">
          <div className="bv-skeleton h-6 w-48" />
          <div className="bv-skeleton hidden h-4 w-64 md:block" />
          <div className="bv-skeleton h-9 w-28" />
        </div>
      </div>

      <div className="section-container section-y space-y-12">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="bv-skeleton mx-auto h-4 w-64" />
          <div className="bv-skeleton mx-auto h-14 w-full" />
          <div className="bv-skeleton mx-auto h-14 w-4/5" />
          <div className="bv-skeleton mx-auto h-5 w-2/3" />
          <div className="flex justify-center gap-3 pt-2">
            <div className="bv-skeleton h-11 w-40" />
            <div className="bv-skeleton h-11 w-36" />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glow-card space-y-4 p-6">
              <div className="bv-skeleton h-5 w-5 rounded" />
              <div className="bv-skeleton h-5 w-40" />
              <div className="bv-skeleton h-4 w-full" />
              <div className="bv-skeleton h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
