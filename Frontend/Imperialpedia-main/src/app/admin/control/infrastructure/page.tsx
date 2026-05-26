import React from 'react';
import { Container } from '@/design-system/layout/container';
import { InfrastructureClient } from './InfrastructureClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Infrastructure & Scale Hub | Governance',
  description: 'Monitor platform clusters, CI/CD pipelines, and data caching nodes. Real-time orchestration of the Imperialpedia scale infrastructure.',
});

/**
 * Platform Infrastructure & Scaling Hub (Governance).
 * Specialized telemetry matrix for monitoring clusters, deployments, and high-velocity queues.
 */
export default function InfrastructurePage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <InfrastructureClient />
      </Container>
    </main>
  );
}
