import React from 'react';
import { Container } from '@/design-system/layout/container';
import { EdgeComputingClient } from './EdgeComputingClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Edge & Multi-Region Hub | Governance',
  description: 'Monitor global region health, edge node resource allocation, and real-time latency telemetry. Orchestrate the Imperialpedia distribution matrix.',
});

/**
 * Platform Edge & Multi-Region Hub (Governance).
 * Specialized telemetry suite for monitoring global replication and edge node performance.
 */
export default function EdgeComputingPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <EdgeComputingClient />
      </Container>
    </main>
  );
}
