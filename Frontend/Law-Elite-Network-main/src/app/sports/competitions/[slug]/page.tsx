import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { CompetitionProfile } from '@/components/sports/CompetitionProfile';
import { getMergedSportsCompetitionBySlug, getMergedSportsCompetitions, getLatestNewsForCompetition } from '@/lib/sports-server';
import { getMergedPeople } from '@/lib/people-server';
import type { Person } from '@/types/person';

export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getMergedSportsCompetitions()).map((c) => ({ slug: c.slug }));
}

export default async function CompetitionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = await getMergedSportsCompetitionBySlug(slug);
  if (!competition) notFound();

  const latestNews = await getLatestNewsForCompetition(competition);

  const peopleBySlug = new Map<string, Person>();
  const allPeople = new Map((await getMergedPeople()).map((p) => [p.slug, p]));
  competition.peopleInvolved?.forEach((credit) => {
    const person = allPeople.get(credit.personSlug);
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
