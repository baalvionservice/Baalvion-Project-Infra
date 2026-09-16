// Renders inside the dashboard shell, so the sidebar and topbar stay put; the shape
// below is the metric row + table every dashboard page resolves to.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading</span>

      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glow-card p-6">
            <div className="flex items-center justify-between">
              <div className="bv-skeleton h-5 w-32" />
              <div className="bv-skeleton h-4 w-4 rounded" />
            </div>
            <div className="bv-skeleton mt-5 h-9 w-28" />
            <div className="bv-skeleton mt-2 h-3 w-40" />
          </div>
        ))}
      </div>

      <div className="glow-card p-6">
        <div className="bv-skeleton h-5 w-48" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bv-skeleton h-4 w-8 shrink-0" />
              <div className="bv-skeleton h-4 flex-1" />
              <div className="bv-skeleton hidden h-4 w-28 sm:block" />
              <div className="bv-skeleton h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
