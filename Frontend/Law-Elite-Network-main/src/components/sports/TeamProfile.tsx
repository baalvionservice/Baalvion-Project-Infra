import React from 'react';
import Link from 'next/link';
import { Shield, ExternalLink } from 'lucide-react';
import { PersonCard } from '@/components/people/PersonCard';
import { articleUrl } from '@/lib/article-url';
import type { SportsTeam } from '@/types/sports';
import type { Person } from '@/types/person';

export function TeamProfile({ team, athletes, latestNews = [] }: { team: SportsTeam; athletes: Person[]; latestNews?: any[] }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl pt-32 pb-24">
      <span className="kicker mb-2 inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {team.sport} Team</span>
      <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">{team.name}</h1>
      <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mt-4">{team.description}</p>
      {team.url && (
        <a href={team.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 mt-4 text-[14px] font-semibold text-blue-600 hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> Official website
        </a>
      )}

      <section className="mt-12">
        <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Athletes</h2>
        {athletes.length === 0 ? (
          <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">
            No profiled athletes are linked to this team yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8">
            {athletes.map((p) => <PersonCard key={p.slug} person={p} />)}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Latest News</h2>
        {latestNews.length === 0 ? (
          <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">
            No published articles mention this team yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {latestNews.map((article) => (
              <li key={article.slug}>
                <Link href={articleUrl(article)} className="text-[15.5px] font-semibold text-slate-900 hover:text-news-600 transition-colors">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[12px] text-slate-400 mt-16">
        <Link href="/sports/teams" className="underline hover:text-slate-600">Back to Teams</Link>
      </p>
    </div>
  );
}
