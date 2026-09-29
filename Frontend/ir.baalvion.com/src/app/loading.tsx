// Mirrors the IrPage shell: the same <main>, hero band paddings and
// `container mx-auto px-4` gutter every route renders into, so the real page
// lands on the same offsets. Header/footer come from the root layout and stay put.
export default function Loading() {
  return (
    <main className="w-full overflow-x-hidden" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <section className="bg-background py-12 md:py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="bv-skeleton h-3 w-56" />
              <div className="bv-skeleton mt-6 h-11 w-full md:h-14" />
              <div className="bv-skeleton mt-3 h-11 w-4/5 md:h-14" />
              <div className="bv-skeleton mt-5 h-5 w-full max-w-md" />
              <div className="bv-skeleton mt-3 h-5 w-3/4 max-w-md" />
              <div className="mt-8 space-y-3">
                <div className="bv-skeleton h-4 w-72 max-w-full" />
                <div className="bv-skeleton h-4 w-64 max-w-full" />
                <div className="bv-skeleton h-4 w-56 max-w-full" />
              </div>
            </div>
            <div className="flex justify-start lg:justify-end">
              <div className="border border-border p-6 rounded-lg w-full max-w-sm">
                <div className="bv-skeleton h-4 w-40" />
                <div className="mt-6 space-y-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between gap-6">
                      <div className="bv-skeleton h-3 w-24" />
                      <div className="bv-skeleton h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="bv-skeleton h-8 w-64 max-w-full" />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="border border-border rounded-lg p-6">
                <div className="bv-skeleton h-5 w-2/3" />
                <div className="bv-skeleton mt-4 h-4 w-full" />
                <div className="bv-skeleton mt-2 h-4 w-5/6" />
                <div className="bv-skeleton mt-2 h-4 w-3/5" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
