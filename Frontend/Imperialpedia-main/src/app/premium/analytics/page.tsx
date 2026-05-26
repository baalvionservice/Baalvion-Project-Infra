import React from 'react';
import { Container } from '@/design-system/layout/container';
import { premiumService } from '@/services/data/premium-service';
import { PremiumAnalyticsClient } from './PremiumAnalyticsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Advanced Analytics Suite | Pro Access',
  description: 'Monitor longitudinal market sentiment, execute portfolio backtesting, and access AI-driven deep-dive analysis.',
});

/**
 * Advanced Analytics Page (Server Entry).
 * Provides deep-telemetry and strategic modeling for Pro-tier users.
 */
export default async function PremiumAnalyticsPage() {
  const response = await premiumService.getAnalytics();
  const analytics = response.data;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <PremiumAnalyticsClient analytics={analytics} />
      </Container>
    </main>
  );
}
