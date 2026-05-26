import React from 'react';
import { Container } from '@/design-system/layout/container';
import { DebatesClient } from './DebatesClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Market Debate Arena | Community Hub',
  description: 'Participate in structured financial debates. Explore Bullish vs Bearish cases, vote on strategic arguments, and earn reputation in the Imperialpedia arena.',
});

/**
 * Financial Debate Rooms Dashboard (Server Entry).
 * Orchestrates the discovery of active market duels and expert-led discussions.
 */
export default function CommunityDebatesPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <DebatesClient />
      </Container>
    </main>
  );
}
