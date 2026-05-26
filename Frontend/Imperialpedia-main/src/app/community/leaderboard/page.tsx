import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getCommunityData } from '@/services/mock-api/community';
import { LeaderboardClient } from './LeaderboardClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Community Leaderboard | Imperialpedia',
  description: 'Tracking the most impactful financial minds and contributors in the Imperialpedia Intelligence Network.',
});

/**
 * Community Leaderboard Page (Server Entry).
 * Fetches authority and ranking data and renders the interactive meritocracy suite.
 */
export default async function CommunityLeaderboardPage() {
  const response = await getCommunityData();
  const communityData = response.data;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <LeaderboardClient data={communityData} />
      </Container>
    </main>
  );
}
