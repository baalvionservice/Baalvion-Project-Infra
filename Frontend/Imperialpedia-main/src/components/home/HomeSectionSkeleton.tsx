import React from "react";

/**
 * Streaming fallback for async homepage rails (Suspense boundary). Keeps the
 * layout's height stable while a section's server data is in flight so real
 * content above/below never blocks on the slowest widget.
 */
export function HomeSectionSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <div className="mb-5 h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/9] w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
