import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PersonProfile } from '@/components/people/PersonProfile';
import { PeopleTabs } from '@/components/people/PeopleTabs';
import { PeopleGrid } from '@/components/people/PeopleGrid';
import { toCardData } from '@/components/people/PersonCard';
import { PersonDisclaimer } from '@/components/people/PersonDisclaimer';
import { getMergedTopics } from '@/lib/topics-server';
import { getMergedPersonBySlug, getMergedPeople, getLatestNewsForPerson } from '@/lib/people-server';
import { getRelatedPeople } from '@/data/people';
import { getLegalCasesForPerson } from '@/lib/legal-server';
import { getCreditedWorksForPerson } from '@/lib/entertainment-server';
import { getCompetitionWorksForPerson } from '@/lib/sports-server';
import { isPersonCategorySlug, personCategoryLabel, PERSON_CATEGORIES } from '@/types/person';

export const revalidate = 86400;

// Pre-render every bundled profile and category directory; anything added later still renders on demand.
export async function generateStaticParams() {
  const people = await getMergedPeople();
  return [...people.map((p) => ({ slug: p.slug })), ...PERSON_CATEGORIES.map((c) => ({ slug: c.slug }))];
}

/**
 * Shares one route segment for two things: a category directory
 * ("/people/actors") and an individual profile ("/people/tom-hanks") --
 * Next.js app router only allows one dynamic segment name per level, so the
 * category check happens here rather than as a sibling `[category]` route.
 */
export default async function PersonOrCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (isPersonCategorySlug(slug)) {
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
                {personCategoryLabel(slug)}
              </h1>
            </header>
            <div className="mb-10">
              <PersonDisclaimer />
            </div>
            <PeopleTabs counts={counts} active={slug} />
            <PeopleGrid people={people.filter((p) => p.category === slug).map(toCardData)} />
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const topics = await getMergedTopics();
  const person = await getMergedPersonBySlug(slug);
  if (!person) notFound();

  const relatedPeople = getRelatedPeople(person);
  const latestNews = await getLatestNewsForPerson(person);
  const legalCases = await getLegalCasesForPerson(person.slug);

  // Works the person is credited on (from the entertainment entries) join any curated ones, without duplicates.
  const credited = [...(await getCreditedWorksForPerson(person.slug)), ...(await getCompetitionWorksForPerson(person.slug))];
  const known = new Set((person.relatedWorks ?? []).map((w) => w.entitySlug).filter(Boolean));
  const profile = credited.length ? { ...person, relatedWorks: [...(person.relatedWorks ?? []), ...credited.filter((w) => !known.has(w.entitySlug))] } : person;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <PersonProfile person={profile} relatedPeople={relatedPeople} latestNews={latestNews} legalCases={legalCases} topics={topics} />
      </main>
      <PublicFooter />
    </div>
  );
}
