import React from 'react';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';
import { Text } from '@/design-system/typography/text';
import { getLeaderboardData } from '@/services/mock-api/creators';
import { LeaderboardClient } from './LeaderboardClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Trophy } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Creator Intelligence Leaderboards',
  description: 'Tracking the most impactful financial minds on the Imperialpedia network. Rankings by revenue, reach, and expert engagement.',
});

/**
 * Expert Leaderboards Page (Server Entry).
 * Fetches initial ranking data and renders the interactive leaderboard suite.
 */
export default async function LeaderboardsPage() {
  const response = await getLeaderboardData();
  const leaderboard = response.data;

  return (
    <main className="min-h-screen bg-background pt-16">
      <Section spacing="md">
        <Container>
          <header className="mb-16 max-w-3xl">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Trophy className="h-5 w-5" />
              <Text variant="label" className="font-bold tracking-widest">Platform Meritocracy</Text>
            </div>
            <Text variant="h1" className="mb-6">Expert Intelligence Rankings</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed">
              Recognizing the world's leading financial contributors. Rankings are calculated based on organic intelligence reach, verifiable impact, and creator revenue velocity.
            </Text>
          </header>

          <LeaderboardClient initialData={leaderboard} />
        </Container>
      </Section>
    </main>
  );
}
