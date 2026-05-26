import React from 'react';
import { Container } from '@/design-system/layout/container';
import { ReputationClient } from './ReputationClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Community Reputation Hub | Authority Matrix',
  description: 'Track your authority score, earn achievement badges, and discover top-ranking contributors in the Imperialpedia meritocracy.',
});

/**
 * Community Reputation Engine Page (Server Entry).
 * Orchestrates the discovery of user authority nodes and network leaderboards.
 */
export default function CommunityReputationPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <ReputationClient />
      </Container>
    </main>
  );
}
