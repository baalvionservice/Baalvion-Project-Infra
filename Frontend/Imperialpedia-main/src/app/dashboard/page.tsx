import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getMockUserDashboard } from '@/services/mock-api/user-dashboard';
import { DashboardClient } from './DashboardClient';
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
export default async function UserDashboardPage() {
  const response = await getMockUserDashboard();
  const dashboardData = response.data;

  return (
    <main className="min-h-screen bg-background pt-8">
      <Container>
        <DashboardClient data={dashboardData} />
      </Container>
    </main>
  );
}
