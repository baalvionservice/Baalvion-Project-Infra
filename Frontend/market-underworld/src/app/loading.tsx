import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Skeleton } from '@/components/ui/skeleton';

// Route-level loading state. Every page in the app renders the Navbar itself,
// so it belongs here too — otherwise the header disappears mid-navigation and
// the hero jumps by the fixed-nav offset once the real page arrives.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0B0C0F]">
      <Navbar />

      <section
        className="min-h-screen flex items-center justify-center pt-24 lg:pt-20 px-4 sm:px-6 bg-black"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">Loading</span>
        <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-8 lg:space-y-10">
            <div className="space-y-6">
              <Skeleton className="h-3 w-56" />
              <div className="space-y-3">
                <Skeleton className="h-11 md:h-16 w-full" />
                <Skeleton className="h-11 md:h-16 w-11/12" />
                <Skeleton className="h-11 md:h-16 w-3/4" />
              </div>
              <div className="space-y-2 max-w-xl">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-[52px] w-full sm:w-52" />
              <Skeleton className="h-[52px] w-full sm:w-52" />
            </div>
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-[360px] w-full rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}
