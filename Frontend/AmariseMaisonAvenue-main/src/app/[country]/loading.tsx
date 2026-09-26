/**
 * Storefront loading state. Deliberately neutral — this one fallback covers the
 * home page, category grids, product pages and checkout alike, so it mirrors the
 * shared `container mx-auto px-6 py-24` band rather than mocking any one of them;
 * a hero-shaped placeholder would shift hard on every route that has no hero.
 */
export default function Loading() {
  return (
    <div
      className="container mx-auto min-h-[70vh] px-6 py-24"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <div className="bv-skeleton h-3 w-40" />
      <div className="bv-skeleton mt-8 h-10 w-3/4 max-w-2xl sm:h-12" />
      <div className="bv-skeleton mt-5 h-4 w-full max-w-xl" />
      <div className="bv-skeleton mt-3 h-4 w-2/3 max-w-xl" />

      <div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="bv-skeleton aspect-[3/4] w-full rounded-none" />
            <div className="bv-skeleton mt-4 h-3 w-1/2" />
            <div className="bv-skeleton mt-2 h-4 w-4/5" />
            <div className="bv-skeleton mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
