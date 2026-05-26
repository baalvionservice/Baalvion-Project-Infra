import React from 'react';
import { Container } from '@/design-system/layout/container';
import { PremiumDashboardClient } from './PremiumDashboardClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Performance Hub | Premium Business Analytics',
  description: 'Monitor platform growth, revenue velocity, and advanced user lifecycle metrics for the Imperialpedia Pro Intelligence network.',
});

/**
 * Premium Business Dashboard Page (Server Entry).
 * Orchestrates the discovery of business intelligence, reports, and advanced cohort metrics.
 */
export default function PremiumDashboardPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <PremiumDashboardClient />
      </Container>
    </main>
  );
}
