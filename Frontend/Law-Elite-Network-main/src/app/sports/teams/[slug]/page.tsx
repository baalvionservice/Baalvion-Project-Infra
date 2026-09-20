import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { TeamProfile } from '@/components/sports/TeamProfile';
import { getMergedSportsTeamBySlug, getLatestNewsForTeam } from '@/lib/sports-server';
import { getAllPeople } from '@/data/people';
import { getAllSportsTeams } from '@/data/sports-teams';

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllSportsTeams().map((t) => ({ slug: t.slug }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getMergedSportsTeamBySlug(slug);
  if (!team) notFound();

  const athletes = getAllPeople().filter((p) => p.sportsInfo?.teamSlug === slug);
  const latestNews = await getLatestNewsForTeam(slug);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <TeamProfile team={team} athletes={athletes} latestNews={latestNews} />
      </main>
      <PublicFooter />
    </div>
  );
}
