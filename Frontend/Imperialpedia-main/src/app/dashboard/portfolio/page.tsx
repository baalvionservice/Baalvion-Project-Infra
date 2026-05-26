import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getMockUserPortfolio } from '@/services/mock-api/user-dashboard';
import { PortfolioTrackerClient } from './PortfolioTrackerClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
import { Text } from '@/design-system/typography/text';

export const metadata: Metadata = buildMetadata({
  title: 'Portfolio & Watchlists | My Studio',
  description: 'Manage your active investment nodes, monitor real-time performance, and orchestrate custom market alerts.',
});

/**
 * Portfolio and Watchlist Management Hub (Server Entry).
 * Fetches user-specific asset data and hands off to the interactive tracker client.
 */
export default async function PortfolioDashboardPage() {
  const response = await getMockUserPortfolio();
  const portfolioData = response.data;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary border border-secondary/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <Text variant="label" className="font-bold tracking-widest text-secondary">Asset Management Hub</Text>
          </div>
          <Text variant="h1" className="text-4xl font-bold tracking-tight">Portfolio & Watchlists</Text>
          <Text variant="body" className="text-muted-foreground text-lg max-w-2xl mt-2">
            Precision oversight of your financial nodes. Orchestrate capital allocation and stay synchronized with market shifts across your core matrices.
          </Text>
        </header>

        <PortfolioTrackerClient data={portfolioData} />
      </Container>
    </main>
  );
}
