import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { EntertainmentProfile } from '@/components/entertainment/EntertainmentProfile';
import { getMergedEntertainmentEntityBySlug, getLatestNewsForEntity } from '@/lib/entertainment-server';
import { getRelatedEntertainmentEntities } from '@/data/entertainment';
import { getPersonBySlug } from '@/data/people';
import type { Person } from '@/types/person';
import { getAllEntertainmentEntities } from '@/data/entertainment';

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllEntertainmentEntities().map((e) => ({ slug: e.slug }));
}

export default async function EntertainmentEntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await getMergedEntertainmentEntityBySlug(slug);
  if (!entity) notFound();

  const relatedEntities = getRelatedEntertainmentEntities(entity);
  const latestNews = await getLatestNewsForEntity(entity);

  const peopleBySlug = new Map<string, Person>();
  entity.peopleInvolved.forEach((credit) => {
    const person = getPersonBySlug(credit.personSlug);
    if (person) peopleBySlug.set(credit.personSlug, person);
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <EntertainmentProfile entity={entity} peopleBySlug={peopleBySlug} relatedEntities={relatedEntities} latestNews={latestNews} />
      </main>
      <PublicFooter />
    </div>
  );
}
