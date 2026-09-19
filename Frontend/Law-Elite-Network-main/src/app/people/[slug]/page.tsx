import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { PersonProfile } from '@/components/people/PersonProfile';
import { PeopleDirectory } from '@/components/people/PeopleDirectory';
import { PersonDisclaimer } from '@/components/people/PersonDisclaimer';
import { getMergedPersonBySlug, getMergedPeople, getLatestNewsForPerson } from '@/lib/people-server';
import { getRelatedPeople } from '@/data/people';
import { getLegalCasesForPerson } from '@/lib/legal-server';
import { isPersonCategorySlug, personCategoryLabel } from '@/types/person';

export const revalidate = 86400;

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
            <PeopleDirectory people={people} initialCategory={slug} />
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const person = await getMergedPersonBySlug(slug);
  if (!person) notFound();

  const relatedPeople = getRelatedPeople(person);
  const latestNews = await getLatestNewsForPerson(person);
  const legalCases = getLegalCasesForPerson(person.slug);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <PersonProfile person={person} relatedPeople={relatedPeople} latestNews={latestNews} legalCases={legalCases} />
      </main>
      <PublicFooter />
    </div>
  );
}
