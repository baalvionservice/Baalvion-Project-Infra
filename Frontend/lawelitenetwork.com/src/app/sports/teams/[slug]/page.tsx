import React from 'react';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { TeamProfile } from '@/components/sports/TeamProfile';
import { getMergedSportsTeamBySlug, getMergedSportsTeams, getLatestNewsForTeam } from '@/lib/sports-server';
import { getMergedAthletesForTeam } from '@/lib/people-server';

export const revalidate = 86400;

export async function generateStaticParams() {
  return (await getMergedSportsTeams()).map((t) => ({ slug: t.slug }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getMergedSportsTeamBySlug(slug);
  if (!team) notFound();

  const athletes = await getMergedAthletesForTeam(slug);
  const latestNews = await getLatestNewsForTeam(slug, athletes);

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
