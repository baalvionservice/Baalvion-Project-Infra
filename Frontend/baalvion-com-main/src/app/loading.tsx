import { SiteHeader } from '@/components/site-header';

/**
 * Route-level loading state.
 *
 * Mirrors the PageShell header block exactly — same paddings, same measures —
 * so the real page swaps in without shifting anything.
 */
export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">
        <header className="relative border-b hairline-strong bg-ink-deep">
          <div className="site-container pb-12 pt-28 md:pb-16 md:pt-36">
            <div className="bv-skeleton mb-4 h-3 w-40" />
            <div className="bv-skeleton mb-3 h-3 w-24" />
            <div className="bv-skeleton h-10 w-full max-w-4xl md:h-14" />
            <div className="bv-skeleton mt-6 h-5 w-full max-w-3xl" />
            <div className="bv-skeleton mt-2 h-5 w-2/3 max-w-3xl" />
          </div>
        </header>

        <div className="site-container py-16 md:py-24" role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading</span>
          <div className="space-y-4">
            <div className="bv-skeleton h-4 w-full max-w-3xl" />
            <div className="bv-skeleton h-4 w-full max-w-3xl" />
            <div className="bv-skeleton h-4 w-5/6 max-w-3xl" />
            <div className="bv-skeleton h-4 w-3/5 max-w-3xl" />
          </div>
        </div>
      </main>
    </>
  );
}
