import React from 'react';
import { FollowButton } from '@/components/member/FollowButton';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Clapperboard, Gavel, Trophy } from 'lucide-react';
import { resolvePersonImage } from '@/lib/article-art';
import { countryNameByCode } from '@/lib/countries';
import { articleUrl } from '@/lib/article-url';
import { personCategoryLabel } from '@/types/person';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { legalCaseUrl } from '@/lib/legal-case-url';
import { relatedWorkUrl } from '@/lib/related-work-url';
import { teamUrl, competitionUrl } from '@/lib/sports-url';
import { PersonDisclaimer } from './PersonDisclaimer';
import { PersonCard } from './PersonCard';
import { PersonSidebar } from './PersonSidebar';
import type { Person, RelatedWork } from '@/types/person';
import type { LegalCase } from '@/types/legal';

/** First sentence of the biography, used as the hero subtitle when no explicit `shortBio` is set. */
function deriveShortBio(person: Person): string {
  if (person.shortBio) return person.shortBio;
  const match = person.biography.match(/^.*?[.!?](?:\s|$)/);
  return (match ? match[0] : person.biography).trim();
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-headline text-xl font-bold text-slate-900 tracking-tight mb-4 pb-2 border-b border-slate-200">
      {children}
    </h2>
  );
}

function StatusPill({ status }: { status: Person['status'] }) {
  if (status === 'active') return null;
  const label = status === 'deceased' ? 'Deceased' : status === 'retired' ? 'Retired' : 'Inactive';
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1">
      {label}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-4 py-6 text-center">{children}</p>;
}

function MediaGrid({ items }: { items: NonNullable<Person['videos']> }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block group border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
          <div className="relative aspect-video bg-slate-100">
            {item.thumbnailUrl && (
              <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            )}
          </div>
          <div className="p-3">
            <p className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-2">{item.title}</p>
            {item.source && <p className="text-[11.5px] text-slate-500 mt-1">{item.source}</p>}
          </div>
        </a>
      ))}
    </div>
  );
}

const ENTERTAINMENT_WORK_TYPES: RelatedWork['type'][] = ['movie', 'show', 'album', 'song'];
const SPORTS_WORK_TYPES: RelatedWork['type'][] = ['sports-event', 'team'];

/**
 * One profile layout for every category (actors through judges) — category
 * only changes which of these sections has anything in it, not the template
 * itself. Related Entertainment / Legal Coverage / Related Sports below all
 * read the same `relatedWorks` field, split by `type`, rather than being
 * separate per-profession fields — a lawyer's `legal-case` entries and an
 * actor's `movie` entries share one shape.
 */
export function PersonProfile({
  person,
  relatedPeople,
  latestNews,
  legalCases = [],
}: {
  person: Person;
  relatedPeople: Person[];
  latestNews: any[];
  legalCases?: LegalCase[];
}) {
  const name = person.displayName || person.fullName;
  const born = person.birthDate ? new Date(person.birthDate).getFullYear() : null;
  const died = person.deathDate ? new Date(person.deathDate).getFullYear() : null;

  const entertainmentWorks = person.relatedWorks?.filter((w) => ENTERTAINMENT_WORK_TYPES.includes(w.type)) || [];
  const sportsWorks = person.relatedWorks?.filter((w) => SPORTS_WORK_TYPES.includes(w.type)) || [];
  const legalWorks = person.relatedWorks?.filter((w) => w.type === 'legal-case') || [];
  const otherWorks = person.relatedWorks?.filter((w) => w.type === 'other') || [];

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
            <div className="relative w-36 h-36 md:w-44 md:h-44 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
              <Image
                src={resolvePersonImage({ avatarUrl: person.avatarUrl, name, avatarSeed: person.avatarSeed || person.slug })}
                alt={name}
                fill
                unoptimized={!person.avatarUrl}
                priority
                sizes="176px"
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <span className="kicker mb-2 inline-block">{personCategoryLabel(person.category)}</span>
              <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {name}
                {person.verification.verified && (
                  <BadgeCheck className="w-7 h-7 text-blue-600 shrink-0" aria-label="Verified reference profile" />
                )}
                <StatusPill status={person.status} />
              </h1>
<div className="mt-4"><FollowButton entityType="person" slug={person.slug} /></div>
              {person.displayName && person.displayName !== person.fullName && (
                <p className="text-sm text-slate-500 mt-1.5">{person.fullName}</p>
              )}

              <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
                {deriveShortBio(person)}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 mt-5 text-[13.5px] text-slate-600 font-medium">
                {person.countryCode && <span>{countryNameByCode(person.countryCode)}</span>}
                {born && (
                  <span>
                    {died ? `${born}–${died}` : `Born ${born}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Body: main content + sticky sidebar ───────────────────── */}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-8 min-w-0">

            <div className="mb-10">
              <PersonDisclaimer />
            </div>

            {/* About */}
            <section className="mb-12">
              <SectionHeading>About</SectionHeading>
              <p className="text-[16px] leading-relaxed text-slate-700 font-serif">{person.biography}</p>
            </section>

            {/* Career */}
            {person.career.length > 0 && (
              <section className="mb-12">
                <SectionHeading>Career</SectionHeading>
                <ul className="space-y-4">
                  {person.career.map((entry, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="w-28 shrink-0 text-[13px] font-bold text-slate-500 pt-0.5">
                        {entry.startYear}{entry.endYear ? `–${entry.endYear}` : entry.startYear ? '–present' : ''}
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold text-slate-900">
                          {entry.title}{entry.organization ? ` · ${entry.organization}` : ''}
                        </p>
                        {entry.description && <p className="text-[14px] text-slate-600 mt-1">{entry.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sports Profile -- sport/position/team/achievements/major competitions/statistics, only rendered when sportsInfo is set (see PersonSportsInfo, kept as one optional nested field so no other category is affected). */}
            {person.sportsInfo && (
              <section className="mb-12">
                <SectionHeading>
                  <span className="inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-slate-400" /> Sports Profile</span>
                </SectionHeading>

                <dl className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Sport</dt>
                    <dd className="text-[15px] font-semibold text-slate-900 mt-0.5">{person.sportsInfo.sport}</dd>
                  </div>
                  {person.sportsInfo.position && (
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Position</dt>
                      <dd className="text-[15px] font-semibold text-slate-900 mt-0.5">{person.sportsInfo.position}</dd>
                    </div>
                  )}
                  {person.sportsInfo.team && (
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Team</dt>
                      <dd className="text-[15px] font-semibold text-slate-900 mt-0.5">
                        {person.sportsInfo.teamSlug ? (
                          <Link href={teamUrl(person.sportsInfo.teamSlug)} className="hover:text-news-600 transition-colors">{person.sportsInfo.team}</Link>
                        ) : person.sportsInfo.team}
                      </dd>
                    </div>
                  )}
                </dl>

                {person.sportsInfo.achievements && person.sportsInfo.achievements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[13px] font-bold text-slate-700 mb-2">Achievements</h3>
                    <ul className="flex flex-wrap gap-2">
                      {person.sportsInfo.achievements.map((a, i) => (
                        <li key={i} className="text-[13px] font-medium text-slate-700 bg-slate-100 rounded-full px-3 py-1.5">
                          {a.title}{a.year ? ` (${a.year})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {person.sportsInfo.majorCompetitions && person.sportsInfo.majorCompetitions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-[13px] font-bold text-slate-700 mb-2">Major Competitions</h3>
                    <ul className="space-y-2">
                      {person.sportsInfo.majorCompetitions.map((c, i) => (
                        <li key={i} className="text-[14px] text-slate-700">
                          {c.competitionSlug ? (
                            <Link href={competitionUrl(c.competitionSlug)} className="font-semibold text-slate-900 hover:text-news-600 transition-colors">{c.title}</Link>
                          ) : (
                            <span className="font-semibold text-slate-900">{c.title}</span>
                          )}
                          {c.year ? ` (${c.year})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {person.sportsInfo.statistics && Object.keys(person.sportsInfo.statistics).length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-700 mb-2">Statistics</h3>
                    <dl className="space-y-2">
                      {Object.entries(person.sportsInfo.statistics).map(([label, value]) => (
                        <div key={label} className="text-[14px]">
                          <dt className="inline font-semibold text-slate-900">{label}: </dt>
                          <dd className="inline text-slate-600">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </section>
            )}

            {/* Education */}
            {person.education && person.education.length > 0 && (
              <section className="mb-12">
                <SectionHeading>Education</SectionHeading>
                <ul className="space-y-2">
                  {person.education.map((entry, i) => (
                    <li key={i} className="text-[15px] text-slate-700">
                      <span className="font-semibold text-slate-900">{entry.institution}</span>
                      {entry.degree ? ` — ${entry.degree}` : ''}{entry.year ? ` (${entry.year})` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Timeline */}
            {person.timeline && person.timeline.length > 0 && (
              <section className="mb-12">
                <SectionHeading>Timeline</SectionHeading>
                <ol className="space-y-4 border-l-2 border-slate-200 pl-5">
                  {person.timeline.map((entry, i) => (
                    <li key={i}>
                      <p className="text-[12.5px] font-bold text-news-600 uppercase tracking-tight">{entry.date}</p>
                      <p className="text-[15px] font-semibold text-slate-900">{entry.title}</p>
                      {entry.description && <p className="text-[14px] text-slate-600 mt-0.5">{entry.description}</p>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Related Entertainment */}
            {entertainmentWorks.length > 0 && (
              <section className="mb-12">
                <SectionHeading>
                  <span className="inline-flex items-center gap-2"><Clapperboard className="w-4 h-4 text-slate-400" /> Related Entertainment</span>
                </SectionHeading>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {entertainmentWorks.map((work, i) => (
                    <li key={i} className="border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-300 transition-colors">
                      {work.entitySlug ? (
                        <Link href={entertainmentUrl(work.entitySlug)} className="group">
                          <p className="text-[15px] font-semibold text-slate-900 group-hover:text-news-600">{work.title}{work.year ? ` (${work.year})` : ''}</p>
                          {work.role && <p className="text-[13px] text-slate-500">{work.role}</p>}
                        </Link>
                      ) : (
                        <>
                          <p className="text-[15px] font-semibold text-slate-900">{work.title}{work.year ? ` (${work.year})` : ''}</p>
                          {work.role && <p className="text-[13px] text-slate-500">{work.role}</p>}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Related Sports */}
            {sportsWorks.length > 0 && (
              <section className="mb-12">
                <SectionHeading>
                  <span className="inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-slate-400" /> Related Sports</span>
                </SectionHeading>
                <ul className="flex flex-wrap gap-2">
                  {sportsWorks.map((work, i) => {
                    const url = relatedWorkUrl(work);
                    const label = `${work.title}${work.role ? ` — ${work.role}` : ''}`;
                    return (
                      <li key={i}>
                        {url ? (
                          <Link href={url} className="text-[13.5px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-3.5 py-1.5 transition-colors inline-block">
                            {label}
                          </Link>
                        ) : (
                          <span className="text-[13.5px] font-medium text-slate-700 bg-slate-100 rounded-full px-3.5 py-1.5 inline-block">{label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Legal Coverage -- real, structured Case entities (@/data/legal-cases.ts) when this person is a party/lawyer/judge on one, since that's now a real system (see project_len-legal-section memory). `legalWorks` is a fallback for a legal matter noted on the person record before it has a full Case entity of its own. */}
            {(legalCases.length > 0 || legalWorks.length > 0) && (
              <section className="mb-12">
                <SectionHeading>
                  <span className="inline-flex items-center gap-2"><Gavel className="w-4 h-4 text-slate-400" /> Legal Coverage</span>
                </SectionHeading>
                <ul className="space-y-3">
                  {legalCases.map((c) => {
                    const role = [...c.parties, ...c.lawyers, ...c.judges].find((p) => p.personSlug === person.slug)?.role;
                    return (
                      <li key={c.slug} className="border border-slate-200 rounded-lg px-4 py-3 hover:border-slate-300 transition-colors">
                        <Link href={legalCaseUrl(c.slug)} className="group">
                          <p className="text-[15px] font-semibold text-slate-900 group-hover:text-news-600">{c.caseName}</p>
                          {role && <p className="text-[13px] text-slate-500">{role}</p>}
                        </Link>
                      </li>
                    );
                  })}
                  {legalWorks.map((work, i) => (
                    <li key={i} className="border border-slate-200 rounded-lg px-4 py-3">
                      <p className="text-[15px] font-semibold text-slate-900">{work.title}{work.year ? ` (${work.year})` : ''}</p>
                      {work.role && <p className="text-[13px] text-slate-500">{work.role}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {otherWorks.length > 0 && (
              <section className="mb-12">
                <SectionHeading>Notable Work</SectionHeading>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {otherWorks.map((work, i) => (
                    <li key={i} className="border border-slate-200 rounded-lg px-4 py-3">
                      <p className="text-[15px] font-semibold text-slate-900">{work.title}{work.year ? ` (${work.year})` : ''}</p>
                      {work.role && <p className="text-[13px] text-slate-500">{work.role}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Related organizations */}
            {person.relatedOrganizations && person.relatedOrganizations.length > 0 && (
              <section className="mb-12">
                <SectionHeading>Related Organizations</SectionHeading>
                <ul className="flex flex-wrap gap-2">
                  {person.relatedOrganizations.map((org, i) => (
                    <li key={i} className="text-[13.5px] font-medium text-slate-700 bg-slate-100 rounded-full px-3.5 py-1.5">
                      {org.name}{org.role ? ` — ${org.role}` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Latest News */}
            <section className="mb-12">
              <SectionHeading>Latest News</SectionHeading>
              {latestNews.length === 0 ? (
                <EmptyState>No published articles mention {name} yet.</EmptyState>
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

            {/* Videos */}
            <section className="mb-12">
              <SectionHeading>Videos</SectionHeading>
              {person.videos?.length ? <MediaGrid items={person.videos} /> : <EmptyState>No videos published for this profile yet.</EmptyState>}
            </section>

            {/* Interviews */}
            <section className="mb-12">
              <SectionHeading>Interviews</SectionHeading>
              {person.interviews?.length ? <MediaGrid items={person.interviews} /> : <EmptyState>No interviews published for this profile yet.</EmptyState>}
            </section>

            {/* Photos */}
            <section className="mb-12">
              <SectionHeading>Photos</SectionHeading>
              {person.photos?.length ? <MediaGrid items={person.photos} /> : <EmptyState>No photo gallery published for this profile yet.</EmptyState>}
            </section>

            {/* Related people */}
            {relatedPeople.length > 0 && (
              <section>
                <SectionHeading>Related People</SectionHeading>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8">
                  {relatedPeople.map((p) => <PersonCard key={p.slug} person={p} />)}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4">
            <PersonSidebar person={person} />
          </div>
        </div>
      </div>
    </div>
  );
}
