import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getCommunityData } from '@/services/mock-api/community';
import { ContestsClient } from './ContestsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Community Polls & Contests | Imperialpedia',
  description: 'Participate in market forecasts, prediction challenges, and community-led financial contests to earn reputation nodes.',
});

/**
 * Community Contests & Polls Page (Server Entry).
 * Fetches initial challenge data and hands off to the interactive hub.
 */
export default async function CommunityContestsPage() {
  const response = await getCommunityData();
  const communityData = response.data;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <ContestsClient data={communityData} />
      </Container>
    </main>
  );
}
