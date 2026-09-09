import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Route-level loading state. Mirrors the homepage shell exactly — same header
// offset, same masthead band, same 8/4 hero grid inside the max-w-7xl
// container — so the real page swaps in without moving anything.
export default function Loading() {
  return (
    <div
      className="min-h-screen bg-white pt-[60px] lg:pt-[96px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>

      <section className="border-b border-slate-100 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-8">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-9 md:h-11 w-full max-w-2xl mt-3" />
          <Skeleton className="h-9 md:h-11 w-2/3 max-w-xl mt-2 hidden md:block" />
          <Skeleton className="h-4 w-full max-w-2xl mt-4" />
          <Skeleton className="h-4 w-4/5 max-w-2xl mt-2" />
          <Skeleton className="h-11 w-52 rounded-md mt-6" />
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <section className="py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8 space-y-9">
              <div className="space-y-4">
                <Skeleton className="aspect-[16/9] w-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-11/12" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 pt-2 border-t border-slate-100">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[16/9] w-full" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-9">
              <Skeleton className="h-3 w-24" />
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
