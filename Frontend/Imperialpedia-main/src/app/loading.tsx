import React from "react";
import { HomeSectionSkeleton } from "@/components/home/HomeSectionSkeleton";

/**
 * Route-level loading state. Mirrors the intro block's container and paddings
 * (see HomeIntro) so the real page swaps in without shifting anything, and
 * reuses the homepage rail skeleton rather than inventing a second look.
 */
export default function Loading() {
  return (
    <div className="flex flex-col w-full" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-4 w-full">
        <div className="max-w-3xl space-y-4">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </section>

      <HomeSectionSkeleton cards={4} />
      <HomeSectionSkeleton cards={4} />
    </div>
  );
}
