import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { CompetitionProfile } from '@/components/sports/CompetitionProfile';
import { getMergedSportsCompetitionBySlug, getLatestNewsForCompetition } from '@/lib/sports-server';
import { getPersonBySlug } from '@/data/people';
import type { Person } from '@/types/person';
import { getAllSportsCompetitions } from '@/data/sports-competitions';

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllSportsCompetitions().map((c) => ({ slug: c.slug }));
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = await getMergedSportsCompetitionBySlug(slug);
  if (!competition) notFound();

  const latestNews = await getLatestNewsForCompetition(competition);

  const peopleBySlug = new Map<string, Person>();
  competition.peopleInvolved?.forEach((credit) => {
    const person = getPersonBySlug(credit.personSlug);
    if (person) peopleBySlug.set(credit.personSlug, person);
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <CompetitionProfile competition={competition} peopleBySlug={peopleBySlug} latestNews={latestNews} />
      </main>
      <PublicFooter />
    </div>
  );
}
