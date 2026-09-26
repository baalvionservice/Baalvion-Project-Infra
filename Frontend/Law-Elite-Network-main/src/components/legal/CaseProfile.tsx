import React from 'react';
import { FollowButton } from '@/components/member/FollowButton';
import Link from 'next/link';
import { BadgeCheck, Gavel, ExternalLink } from 'lucide-react';
import { articleUrl } from '@/lib/article-url';
import { personUrl } from '@/lib/person-url';
import { courtUrl } from '@/lib/legal-case-url';
import { formatArticleDate } from '@/lib/format-date';
import type { LegalCase, CaseParticipant } from '@/types/legal';
import type { Court } from '@/types/legal';
import type { Person } from '@/types/person';

const STATUS_LABEL: Record<LegalCase['status'], string> = {
  ongoing: 'Ongoing', concluded: 'Concluded', settled: 'Settled', dismissed: 'Dismissed', appealed: 'Appealed',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">
      {children}
    </h2>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">{children}</p>;
}

function ParticipantList({ participants, peopleBySlug }: { participants: CaseParticipant[]; peopleBySlug: Map<string, Person> }) {
  return (
    <ul className="space-y-2">
      {participants.map((p, i) => {
        const person = p.personSlug ? peopleBySlug.get(p.personSlug) : undefined;
        return (
          <li key={i} className="text-[15px] text-slate-700">
            {person ? (
              <Link href={personUrl(person.slug)} className="font-semibold text-slate-900 hover:text-news-600 transition-colors">
                {person.displayName || person.fullName}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">{p.name}</span>
            )}
            <span className="text-slate-500"> — {p.role}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function CaseProfile({
  legalCase,
  court,
  peopleBySlug,
  latestNews,
}: {
  legalCase: LegalCase;
  court: Court | null;
  peopleBySlug: Map<string, Person>;
  latestNews: any[];
}) {
  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-12 md:py-16">
          <span className="kicker mb-2 inline-flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5" /> Legal Case</span>
          <h1 className="font-headline text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.05] flex flex-wrap items-center gap-2.5">
            {legalCase.caseName}
            {legalCase.verification.verified && (
              <BadgeCheck className="w-6 h-6 text-blue-600 shrink-0" aria-label="Verified reference entry" />
            )}
          </h1>
<div className="mt-4"><FollowButton entityType="legal-case" slug={legalCase.slug} /></div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[13.5px] text-slate-600 font-medium">
            {court && (
              <Link href={courtUrl(court.slug)} className="hover:text-news-600 transition-colors font-semibold">
                {court.name}
              </Link>
            )}
            <span>{legalCase.jurisdiction}</span>
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1">
              {STATUS_LABEL[legalCase.status]}
            </span>
          </div>

          <p className="text-lg text-slate-500 max-w-2xl leading-relaxed mt-5">{legalCase.summary}</p>
        </div>
      </section>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-10 md:py-14">

        {legalCase.importantDates.length > 0 && (
          <section className="mb-12">
            <SectionHeading>Important Dates</SectionHeading>
            <ul className="grid sm:grid-cols-2 gap-3">
              {legalCase.importantDates.map((d, i) => (
                <li key={i} className="border border-slate-200 rounded-lg px-4 py-3">
                  <p className="text-[12.5px] font-bold text-news-600 uppercase tracking-tight">{formatArticleDate(d.date) || d.date}</p>
                  <p className="text-[14px] text-slate-700">{d.label}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {legalCase.parties.length > 0 && (
          <section className="mb-12">
            <SectionHeading>Parties</SectionHeading>
            <ParticipantList participants={legalCase.parties} peopleBySlug={peopleBySlug} />
          </section>
        )}

        {legalCase.lawyers.length > 0 && (
          <section className="mb-12">
            <SectionHeading>Lawyers</SectionHeading>
            <ParticipantList participants={legalCase.lawyers} peopleBySlug={peopleBySlug} />
          </section>
        )}

        {legalCase.judges.length > 0 && (
          <section className="mb-12">
            <SectionHeading>Judges</SectionHeading>
            <ParticipantList participants={legalCase.judges} peopleBySlug={peopleBySlug} />
          </section>
        )}

        {legalCase.timeline && legalCase.timeline.length > 0 && (
          <section className="mb-12">
            <SectionHeading>Timeline</SectionHeading>
            <ol className="space-y-4 border-l-2 border-slate-200 pl-5">
              {legalCase.timeline.map((entry, i) => (
                <li key={i}>
                  <p className="text-[12.5px] font-bold text-news-600 uppercase tracking-tight">{formatArticleDate(entry.date) || entry.date}</p>
                  <p className="text-[15px] font-semibold text-slate-900">{entry.title}</p>
                  {entry.description && <p className="text-[14px] text-slate-600 mt-0.5">{entry.description}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mb-12">
          <SectionHeading>Documents</SectionHeading>
          {legalCase.documents?.length ? (
            <ul className="space-y-2">
              {legalCase.documents.map((doc, i) => (
                <li key={i}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> {doc.title}{doc.type ? ` (${doc.type})` : ''}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No linked documents available for this case yet.</EmptyState>
          )}
        </section>

        {peopleBySlug.size > 0 && (
          <section className="mb-12">
            <SectionHeading>Related People</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {Array.from(peopleBySlug.values()).map((person) => (
                <Link
                  key={person.slug}
                  href={personUrl(person.slug)}
                  className="text-[13.5px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors"
                >
                  {person.displayName || person.fullName}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeading>Latest News</SectionHeading>
          {latestNews.length === 0 ? (
            <EmptyState>No published articles cover this case yet.</EmptyState>
          ) : (
            <ul className="space-y-4">
              {latestNews.map((article) => (
                <li key={article.slug}>
                  <Link href={articleUrl(article)} className="group block">
                    <p className="text-[15.5px] font-semibold text-slate-900 group-hover:text-news-600 transition-colors">{article.title}</p>
                    {(article.summary || article.excerpt) && (
                      <p className="text-[13.5px] text-slate-500 mt-1 line-clamp-2">{article.summary || article.excerpt}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-[12px] text-slate-400 mt-16">
          {legalCase.verification.sourceNote}{' '}
          <Link href="/legal/cases" className="underline hover:text-slate-600">Back to Legal Cases</Link>
        </p>
      </div>
    </div>
  );
}
