import React from 'react';
import { Container } from '@/design-system/layout/container';
import { premiumService } from '@/services/data/premium-service';
import { PremiumReportsClient } from './PremiumReportsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Intelligence Reports | Premium Access',
  description: 'Access high-fidelity market reports, sector audits, and tactical intelligence nodes reserved for Pro members.',
});

/**
 * Premium Reports Hub (Server Entry).
 * Orchestrates the discovery of Pro-level financial intelligence.
 */
export default async function PremiumReportsPage() {
  const response = await premiumService.getReports();
  const reports = response.data;

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <PremiumReportsClient initialReports={reports} />
      </Container>
    </main>
  );
}
