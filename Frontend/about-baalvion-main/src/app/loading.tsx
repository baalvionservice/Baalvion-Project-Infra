// Mirrors the server page shell (`main.pt-40 pb-24` + `.section-container`) that
// every top-level route renders into, so content lands on the same offsets. The
// navbar is fixed and lives in the layout, so pt-40 must stay to clear it.
export default function Loading() {
  return (
    <main className="pt-40 pb-24" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="section-container">
        <div className="max-w-4xl mb-20">
          <div className="bv-skeleton h-3 w-48" />
          <div className="bv-skeleton mt-6 h-11 w-full md:h-[52px]" />
          <div className="bv-skeleton mt-4 h-11 w-3/4 md:h-[52px]" />
          <div className="bv-skeleton mt-8 h-5 w-full" />
          <div className="bv-skeleton mt-3 h-5 w-5/6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="glass-card rounded-lg overflow-hidden">
              <div className="h-1.5 w-full bg-gray-50" />
              <div className="p-10 space-y-8">
                <div className="bv-skeleton h-16 w-16 rounded-sm" />
                <div className="space-y-3">
                  <div className="bv-skeleton h-6 w-2/3" />
                  <div className="bv-skeleton h-4 w-full" />
                  <div className="bv-skeleton h-4 w-full" />
                  <div className="bv-skeleton h-4 w-3/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
