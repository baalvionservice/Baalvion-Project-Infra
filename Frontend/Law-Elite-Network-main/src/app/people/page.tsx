import React from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import Link from 'next/link';
import { PeopleTabs } from '@/components/people/PeopleTabs';
import { PersonCard, toCardData } from '@/components/people/PersonCard';
import { PERSON_CATEGORIES } from '@/types/person';
import { PersonDisclaimer } from '@/components/people/PersonDisclaimer';
import { getMergedPeople } from '@/lib/people-server';

// Same rationale as /authors: cached and refreshed in the background rather
// than re-rendered per visitor.
export const revalidate = 86400;

export default async function PeoplePage() {
  const people = await getMergedPeople();
  const counts: Record<string, number> = {};
  people.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              People
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Reference profiles for notable actors, musicians, directors, producers, TV personalities,
              influencers, creators, athletes, lawyers, judges, and other public figures covered across
              the network.
            </p>
          </header>

          <div className="mb-10">
            <PersonDisclaimer />
          </div>

          <PeopleTabs counts={counts} />

          {/* A hub, not a dump: a dozen per category, with a link through to the full directory. */}
          <div className="space-y-16">
            {PERSON_CATEGORIES.map((cat) => {
              const inCategory = people.filter((p) => p.category === cat.slug);
              if (inCategory.length === 0) return null;
              return (
                <section key={cat.slug} aria-labelledby={`cat-${cat.slug}`}>
                  <div className="flex items-end justify-between gap-4 border-b-2 border-slate-900 pb-2 mb-6">
                    <h2 id={`cat-${cat.slug}`} className="font-headline text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {cat.plural}
                    </h2>
                    <Link href={`/people/${cat.slug}`} className="text-[12px] font-bold uppercase tracking-wider text-slate-500 hover:text-news-600">
                      See all {inCategory.length} →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
                    {inCategory.slice(0, 12).map((p) => (
                      <PersonCard key={p.slug} person={toCardData(p)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
