"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

/**
 * @fileOverview Optimized Hero Component
 * Demonstrates:
 * - next/dynamic for heavy components (Stats)
 * - fetchpriority="high" for LCP image
 * - aspect-ratio for CLS protection
 */

const DynamicStats = dynamic(() => import('@/components/landing/stats-bar').then(mod => mod.StatsBar), {
  ssr: false,
  loading: () => <div className="h-24 bg-white/5 animate-pulse rounded-3xl" />
});

const isDev = process.env.NODE_ENV === 'development';

export const OptimizedHero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Instant Dev <span className="text-brand-green">Optimization.</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-xl">
              Engineered for speed. Dev server reloads in milliseconds while production Core Web Vitals remain elite.
            </p>
          </div>

          {/* LCP Image Node with CLS Protection */}
          <div className="flex-1 relative aspect-video w-full rounded-3xl overflow-hidden border border-white/10 bg-brand-surface">
            {isDev ? (
              /* Plain <img> in dev for zero-overhead placeholders */
              <img 
                src="https://picsum.photos/seed/dev-lcp/800/450" 
                alt="Dev Optimization Placeholder"
                className="w-full h-full object-cover"
                // @ts-expect-error - fetchpriority is valid HTML but not yet in React's img attribute types
                fetchpriority="high"
              />
            ) : (
              /* Next.js Image in production for full optimization */
              <Image 
                src="https://picsum.photos/seed/prod-lcp/800/450"
                alt="High Performance Intelligence Asset"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
        </div>

        <div className="mt-20">
          <DynamicStats />
        </div>
      </div>
    </section>
  );
};
