export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading</span>

          <section className="border-b border-line bg-surface/50">
            <div className="container-site flex flex-col items-center gap-6 py-20 text-center sm:py-28">
              <div className="bv-skeleton h-6 w-44 rounded-full" />
              <div className="flex w-full max-w-2xl flex-col items-center gap-3">
                <div className="bv-skeleton h-10 w-full sm:h-12" />
                <div className="bv-skeleton h-10 w-3/4 sm:h-12" />
              </div>
              <div className="flex w-full max-w-xl flex-col items-center gap-2">
                <div className="bv-skeleton h-5 w-full" />
                <div className="bv-skeleton h-5 w-2/3" />
              </div>
              <div className="bv-skeleton h-12 w-full max-w-xl rounded-lg" />
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="bv-skeleton h-10 w-36 rounded-lg" />
                <div className="bv-skeleton h-10 w-36 rounded-lg" />
              </div>
            </div>
          </section>

          <div className="container-site grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-5">
                <div className="bv-skeleton h-5 w-2/3" />
                <div className="bv-skeleton mt-3 h-4 w-full" />
                <div className="bv-skeleton mt-2 h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
