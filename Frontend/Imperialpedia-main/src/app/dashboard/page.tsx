import React from 'react';
import { Container } from '@/design-system/layout/container';
import { DashboardLive } from './DashboardLive';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'My Intelligence Dashboard | Imperialpedia',
  description: 'Monitor your personalized financial intelligence, watchlists, and portfolio performance in real-time.',
});

/**
 * User Personal Dashboard (Server Entry).
 * Fetches personalized intelligence data and hands off to the interactive client.
 */
export default function UserDashboardPage() {
  return (
    <main className="min-h-screen bg-background pt-8">
      <Container>
        <DashboardLive />
      </Container>
    </main>
  );
}
