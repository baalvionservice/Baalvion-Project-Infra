import { SiteHeader } from '@/components/site-header';

// Mirrors PageHero's container and py-24/28 rhythm so the real page swaps in at
// the same offsets. The header is the live one — navigation stays usable while
// the route streams rather than blanking out.
export default function Loading() {
  return (
    <>
      <SiteHeader />
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <section className="relative overflow-hidden border-b border-line bg-mesh-hero">
          <div className="grid-backdrop absolute inset-0" aria-hidden="true" />
          <div className="container-site relative py-24 sm:py-28">
            <div className="bv-skeleton h-3 w-36" />
            <div className="bv-skeleton mt-5 h-11 w-full max-w-3xl sm:h-14" />
            <div className="bv-skeleton mt-3 h-11 w-2/3 max-w-3xl sm:h-14" />
            <div className="bv-skeleton mt-7 h-5 w-full max-w-2xl" />
            <div className="bv-skeleton mt-3 h-5 w-4/5 max-w-2xl" />
          </div>
        </section>
        <section className="border-b border-line py-24">
          <div className="container-site grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="glass-panel p-6">
                <div className="bv-skeleton h-10 w-10 rounded-xl" />
                <div className="bv-skeleton mt-5 h-5 w-2/3" />
                <div className="bv-skeleton mt-3 h-4 w-full" />
                <div className="bv-skeleton mt-2 h-4 w-5/6" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
