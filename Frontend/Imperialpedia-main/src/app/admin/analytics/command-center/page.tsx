import React from 'react';
import { Container } from '@/design-system/layout/container';
import { AnalyticsCommandCenterClient } from './AnalyticsCommandCenterClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Platform Analytics Command Center | Imperialpedia Governance',
  description: 'Enterprise-grade administrative oversight. Monitor global metrics, content performance, and system health alerts for the 1M+ node index.',
});

/**
 * Platform Analytics Command Center Page (Server Entry).
 * Provides high-fidelity administrative oversight into the platform's core vitals.
 */
export default function AnalyticsCommandCenterPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <AnalyticsCommandCenterClient />
      </Container>
    </main>
  );
}
