import React from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { articleUrl } from '@/lib/article-url';
import { personUrl } from '@/lib/person-url';
import { formatArticleDate } from '@/lib/format-date';
import type { SportsCompetition } from '@/types/sports';
import type { Person } from '@/types/person';

const LEVEL_LABEL: Record<SportsCompetition['level'], string> = {
  olympic: 'Olympic Event', championship: 'Championship', tournament: 'Tournament', league: 'League', other: 'Competition',
};

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">{children}</p>;
}

export function CompetitionProfile({
  competition,
  peopleBySlug,
  latestNews,
}: {
  competition: SportsCompetition;
  peopleBySlug: Map<string, Person>;
  latestNews: any[];
}) {
  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl pt-32 pb-24">
      <span className="kicker mb-2 inline-flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> {LEVEL_LABEL[competition.level]} · {competition.sport}</span>
      <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">{competition.name}</h1>
      {competition.date && <p className="mt-3 text-[13.5px] text-slate-600 font-medium">{formatArticleDate(competition.date) || competition.date}</p>}
      <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mt-4">{competition.description}</p>

      {competition.peopleInvolved && competition.peopleInvolved.length > 0 && (
        <section className="mt-12">
          <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Athletes Involved</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {competition.peopleInvolved.map((credit, i) => {
              const person = peopleBySlug.get(credit.personSlug);
              return (
                <li key={i} className="border border-slate-200 rounded-lg px-4 py-3">
                  {person ? (
                    <Link href={personUrl(person.slug)} className="text-[15px] font-semibold text-slate-900 hover:text-news-600 transition-colors">
                      {person.displayName || person.fullName}
                    </Link>
                  ) : (
                    <p className="text-[15px] font-semibold text-slate-900">{credit.personSlug}</p>
                  )}
                  <p className="text-[13px] text-slate-500">{credit.role}{credit.result ? ` — ${credit.result}` : ''}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Latest News</h2>
        {latestNews.length === 0 ? (
          <EmptyState>No published articles cover this competition yet.</EmptyState>
        ) : (
          <ul className="space-y-4">
            {latestNews.map((article) => (
              <li key={article.slug}>
                <Link href={articleUrl(article)} className="group block">
                  <p className="text-[15.5px] font-semibold text-slate-900 group-hover:text-news-600 transition-colors">{article.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Videos</h2>
        {competition.videos?.length ? (
          <ul className="space-y-2">
            {competition.videos.map((v, i) => (
              <li key={i}><a href={v.url} target="_blank" rel="noopener noreferrer" className="text-[14.5px] font-semibold text-blue-600 hover:underline">{v.title}</a></li>
            ))}
          </ul>
        ) : (
          <EmptyState>No videos published for this competition yet.</EmptyState>
        )}
      </section>

      <p className="text-[12px] text-slate-400 mt-16">
        <Link href="/sports/competitions" className="underline hover:text-slate-600">Back to Competitions</Link>
      </p>
    </div>
  );
}
