/**
 * @file app/(dashboard)/marketplace/search/page.tsx
 * @description PROMPT 8 — the marketplace search page. Full-text discovery with
 * Country / Price / Category facets over the catalogue. The interactive experience
 * is a client component (URL-driven state); it is wrapped in Suspense because it
 * reads the request search params.
 */
import { Suspense } from 'react';
import { Telescope } from 'lucide-react';
import { SearchExperience } from '@/components/search/SearchExperience';

export const metadata = {
  title: 'Search · Marketplace',
  description: 'Search the global trade catalogue with country, price and category filters.',
};

export default function MarketplaceSearchPage() {
  return (
    <main className="flex-1 space-y-8 p-4 md:p-6">
      <header className="space-y-4 border-b border-primary/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Catalogue Discovery</p>
        </div>
        <div className="flex items-center gap-3">
          <Telescope className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-black uppercase leading-[0.8] tracking-tighter">Search.</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Full-text search across products, commodities and brands — refined by country of origin, price band and
          category.
        </p>
      </header>

      <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-lg bg-muted" />}>
        <SearchExperience />
      </Suspense>
    </main>
  );
}
