import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { EntertainmentProfile } from '@/components/entertainment/EntertainmentProfile';
import { getMergedEntertainmentEntityBySlug, getMergedEntertainmentEntities, getMergedRelatedEntertainment, getLatestNewsForEntity } from '@/lib/entertainment-server';
import { getMergedPeople } from '@/lib/people-server';
import type { Person } from '@/types/person';

export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getMergedEntertainmentEntities()).map((e) => ({ slug: e.slug }));
}

export default async function EntertainmentEntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await getMergedEntertainmentEntityBySlug(slug);
  if (!entity) notFound();

  const relatedEntities = await getMergedRelatedEntertainment(entity);
  const latestNews = await getLatestNewsForEntity(entity);

  const peopleBySlug = new Map<string, Person>();
  const allPeople = new Map((await getMergedPeople()).map((p) => [p.slug, p]));
  entity.peopleInvolved.forEach((credit) => {
    const person = allPeople.get(credit.personSlug);
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
