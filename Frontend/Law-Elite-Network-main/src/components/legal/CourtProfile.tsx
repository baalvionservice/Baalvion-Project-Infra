import React from 'react';
import { FollowButton } from '@/components/member/FollowButton';
import Link from 'next/link';
import { Landmark, ExternalLink } from 'lucide-react';
import { CaseCard } from './CaseCard';
import { articleUrl } from '@/lib/article-url';
import type { Court } from '@/types/legal';
import type { LegalCase } from '@/types/legal';

const LEVEL_LABEL: Record<Court['level'], string> = {
  trial: 'Trial Court', appellate: 'Appellate Court', supreme: 'Supreme Court', international: 'International Court', other: 'Court',
};

export function CourtProfile({ court, cases, latestNews = [] }: { court: Court; cases: LegalCase[]; latestNews?: any[] }) {
  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-5xl pt-32 pb-24">
      <span className="kicker mb-2 inline-flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> {LEVEL_LABEL[court.level]}</span>
      <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.05]">{court.name}</h1>
<div className="mt-4"><FollowButton entityType="court" slug={court.slug} /></div>
      <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mt-4">{court.description}</p>
      {court.url && (
        <a href={court.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 mt-4 text-[14px] font-semibold text-blue-600 hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> Official website
        </a>
      )}

      <section className="mt-12">
        <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Cases</h2>
        {cases.length === 0 ? (
          <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">
            No cases indexed for this court yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((c) => <CaseCard key={c.slug} legalCase={c} courtName={court.name} />)}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">Latest News</h2>
        {latestNews.length === 0 ? (
          <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">
            No published articles mention this court yet.
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
        <Link href="/legal/courts" className="underline hover:text-slate-600">Back to Courts</Link>
      </p>
    </div>
  );
}
