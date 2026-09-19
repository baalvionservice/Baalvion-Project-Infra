import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PersonCard } from '@/components/people/PersonCard';
import { getPeopleByCategory } from '@/data/people';
import { getMergedSportsTeams, getMergedSportsCompetitions } from '@/lib/sports-server';
import { teamUrl, competitionUrl } from '@/lib/sports-url';

export const revalidate = 86400;

export default async function SportsHubPage() {
  const athletes = getPeopleByCategory('athletes');
  const [teams, competitions] = await Promise.all([
    getMergedSportsTeams(),
    getMergedSportsCompetitions(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">

          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">
              Sports
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Athlete profiles, teams, and competitions covered across the network.
            </p>
          </header>

          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight">Athletes</h2>
              <Link href="/people" className="text-[13px] font-bold text-blue-600 hover:underline">View all people →</Link>
            </div>
            {athletes.length === 0 ? (
              <p className="text-slate-500 text-sm">No athlete profiles yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {athletes.map((p) => <PersonCard key={p.slug} person={p} />)}
              </div>
            )}
          </section>

          <section className="mb-16">
            <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">Teams</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link key={team.slug} href={teamUrl(team.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                  <span className="kicker mb-2">{team.sport}</span>
                  <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{team.name}</h3>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-6">Competitions</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((c) => (
                <Link key={c.slug} href={competitionUrl(c.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                  <span className="kicker mb-2">{c.sport}</span>
                  <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{c.name}</h3>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
