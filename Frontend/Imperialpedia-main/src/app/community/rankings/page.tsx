import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getCommunityRankings } from '@/services/mock-api/community';
import { RankingsClient } from './RankingsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Network Rankings & Leaderboards | Community Hub',
  description: 'Explore the platform meritocracy. See top-ranking analysts, expert authors, and influential community members based on real-time intelligence impact.',
});

/**
 * Community Rankings Dashboard (Server Entry).
 * Orchestrates the discovery of platform-wide authority and contributor performance.
 */
export default async function CommunityRankingsPage() {
  const response = await getCommunityRankings();
  const rankingsData = response.data;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <RankingsClient initialData={rankingsData} />
      </Container>
    </main>
  );
}
