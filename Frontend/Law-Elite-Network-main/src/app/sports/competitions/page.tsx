import React from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { competitionUrl } from '@/lib/sports-url';
import { getMergedSportsCompetitions } from '@/lib/sports-server';

export const revalidate = 86400;

export default async function CompetitionsPage() {
  const competitions = await getMergedSportsCompetitions();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">Competitions</h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">Competitions and events referenced across Law Elite Network's sports coverage.</p>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((c) => (
              <Link key={c.slug} href={competitionUrl(c.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                <span className="kicker mb-2 inline-flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> {c.sport}</span>
                <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{c.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
