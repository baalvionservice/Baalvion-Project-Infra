import React from 'react';
import { FollowButton } from '@/components/member/FollowButton';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { articleArtDataUri } from '@baalvion/illustrations';
import { articleUrl } from '@/lib/article-url';
import { personUrl } from '@/lib/person-url';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { entertainmentTypeLabel } from '@/types/entertainment';
import { EntertainmentCard } from './EntertainmentCard';
import { formatArticleDate } from '@/lib/format-date';
import { resolvePersonImage } from '@/lib/article-art';
import type { EntertainmentEntity } from '@/types/entertainment';
import type { Person } from '@/types/person';

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

function MediaGrid({ items }: { items: NonNullable<EntertainmentEntity['videos']> }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {items.map((v, i) => (
        <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="block group border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
          <div className="relative aspect-video bg-slate-100">
            {v.thumbnailUrl && <Image src={v.thumbnailUrl} alt={v.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />}
          </div>
          <div className="p-3">
            <p className="text-[13.5px] font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-2">{v.title}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

export function EntertainmentProfile({
  entity,
  peopleBySlug,
  relatedEntities,
  latestNews,
}: {
  entity: EntertainmentEntity;
  /** Resolved Person records for entity.peopleInvolved, keyed by personSlug -- a credit with no resolvable profile is just omitted, not a broken link. */
  peopleBySlug: Map<string, Person>;
  relatedEntities: EntertainmentEntity[];
  latestNews: any[];
}) {
  const photo = entity.images?.[0];
  const ownPhoto = !!photo?.url && photo.url.startsWith('/media/');
  const heroImage = (ownPhoto ? `${photo!.url}?w=800` : photo?.url)
    || articleArtDataUri({ title: entity.title, category: entertainmentTypeLabel(entity.type), seed: entity.slug });

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
            <figure className="shrink-0 w-full sm:w-56">
            <div className="relative w-full aspect-[16/10] sm:aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
              <Image
                src={heroImage}
                alt={entity.title}
                fill
                // /media/... is resized by its own route; the generic loader needs an absolute URL.
                unoptimized={!photo?.url || ownPhoto}
                priority
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover"
              />
            </div>
            {photo?.credit && (
              <figcaption className="mt-2 text-[11px] leading-snug text-slate-500 text-left">
                Image: {photo.credit}.{' '}
                {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{photo.license}</a> : photo.license}
                {photo.sourceUrl && <> · <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">Source</a></>}
              </figcaption>
            )}
            </figure>

            <div className="flex-1">
              <span className="kicker mb-2 inline-block">{entertainmentTypeLabel(entity.type)}</span>
              <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {entity.title}
                {entity.verification.verified && (
                  <BadgeCheck className="w-7 h-7 text-blue-600 shrink-0" aria-label="Verified reference entry" />
                )}
              </h1>
<div className="mt-4"><FollowButton entityType="entertainment" slug={entity.slug} /></div>

              <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">{entity.description}</p>

              {entity.releaseDate && (
                <p className="mt-5 text-[13.5px] text-slate-600 font-medium">Released {formatArticleDate(entity.releaseDate)}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-10 md:py-14">

        {/* People Involved -- the actor/director/producer/artist relationship */}
        {entity.peopleInvolved.length > 0 && (
          <section className="mb-12">
            <SectionHeading>People Involved</SectionHeading>
            <ul className="grid sm:grid-cols-2 gap-4">
              {entity.peopleInvolved.map((credit, i) => {
                const person = peopleBySlug.get(credit.personSlug);
                return (
                  <li key={i} className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3">
                    {person && (
                      <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        <Image
                          src={person.avatarUrl?.startsWith('/media/') ? `${person.avatarUrl}?w=240` : resolvePersonImage({ avatarUrl: person.avatarUrl, name: person.displayName || person.fullName, avatarSeed: person.avatarSeed || person.slug })}
                          alt={person.displayName || person.fullName}
                          fill
                          // /media/... is resized by its own route; the generic loader needs an absolute URL.
                          unoptimized={!person.avatarUrl || person.avatarUrl.startsWith('/')}
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      {person ? (
                        <Link href={personUrl(person.slug)} className="text-[15px] font-semibold text-slate-900 hover:text-news-600 transition-colors truncate block">
                          {person.displayName || person.fullName}
                        </Link>
                      ) : (
                        <p className="text-[15px] font-semibold text-slate-900 truncate">{credit.personSlug}</p>
                      )}
                      <p className="text-[13px] text-slate-500">{credit.role}{credit.character ? ` — as ${credit.character}` : ''}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Related entities */}
        {relatedEntities.length > 0 && (
          <section className="mb-12">
            <SectionHeading>Related Entertainment</SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
              {relatedEntities.map((e) => <EntertainmentCard key={e.slug} entity={e} />)}
            </div>
          </section>
        )}

        {/* Latest News */}
        <section className="mb-12">
          <SectionHeading>Latest News</SectionHeading>
          {latestNews.length === 0 ? (
            <EmptyState>No published articles mention {entity.title} yet.</EmptyState>
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
          {entity.videos?.length ? <MediaGrid items={entity.videos} /> : <EmptyState>No videos published for this entry yet.</EmptyState>}
        </section>

        {/* Interviews */}
        <section>
          <SectionHeading>Interviews</SectionHeading>
          {entity.interviews?.length ? <MediaGrid items={entity.interviews} /> : <EmptyState>No interviews published for this entry yet.</EmptyState>}
        </section>

        <p className="text-[12px] text-slate-400 mt-16">
          {entity.verification.sourceNote}{' '}
          <Link href="/entertainment" className="underline hover:text-slate-600">Back to Entertainment</Link>
        </p>
      </div>
    </div>
  );
}
