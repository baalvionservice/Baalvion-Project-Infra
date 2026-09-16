// Nav and footer live in the root layout, so only the main region needs a
// placeholder. Mirrors the home hero's two-column split and its 1584px measure
// so the real page swaps in without shifting.
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>

      <section className="border-b border-[hsl(var(--line))]">
        <div className="mx-auto grid max-w-[1584px] lg:grid-cols-2">
          <div className="flex flex-col justify-center border-[hsl(var(--line))] px-6 py-16 lg:border-r lg:py-24 lg:pr-14">
            <div className="bv-skeleton h-3 w-40" />
            <div className="bv-skeleton mt-8 h-12 w-full max-w-lg" />
            <div className="bv-skeleton mt-3 h-12 w-3/4 max-w-md" />
            <div className="bv-skeleton mt-8 h-5 w-full max-w-xl" />
            <div className="bv-skeleton mt-2 h-5 w-2/3 max-w-xl" />
            <div className="mt-10 flex flex-wrap gap-3">
              <div className="bv-skeleton h-12 w-44" />
              <div className="bv-skeleton h-12 w-36" />
            </div>
          </div>
          <div className="bv-skeleton m-6 aspect-[4/3] lg:m-0 lg:aspect-auto" />
        </div>
      </section>

      <div className="mx-auto max-w-[1584px] px-6 py-16">
        <div className="grid gap-px bg-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-[hsl(var(--paper))] p-8">
              <div className="bv-skeleton h-3 w-24" />
              <div className="bv-skeleton mt-4 h-6 w-2/3" />
              <div className="bv-skeleton mt-3 h-4 w-full" />
              <div className="bv-skeleton mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
