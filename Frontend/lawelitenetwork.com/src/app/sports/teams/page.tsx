import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { teamUrl } from '@/lib/sports-url';
import { countryNameByCode } from '@/lib/countries';
import { getMergedSportsTeams } from '@/lib/sports-server';

export const revalidate = 86400;

export default async function TeamsPage() {
  const teams = await getMergedSportsTeams();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <header className="mb-10 max-w-3xl">
            <span className="text-[12px] font-bold text-blue-600 uppercase tracking-tight">Law Elite Network</span>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 leading-tight mt-2">Teams</h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">Teams referenced across Law Elite Network's sports coverage.</p>
          </header>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link key={team.slug} href={teamUrl(team.slug)} className="group block border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors">
                <span className="kicker mb-2 inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {team.sport}</span>
                <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors">{team.name}</h3>
                {team.countryCode && <p className="mt-1 text-[13px] text-slate-500 font-medium">{countryNameByCode(team.countryCode)}</p>}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
