import React from 'react';
import { Container } from '@/design-system/layout/container';
import { ExperimentConsoleClient } from './ExperimentConsoleClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Experiment Console | Optimization Hub',
  description: 'Orchestrate A/B testing, manage feature rollouts, and monitor conversion velocity across the Imperialpedia Index.',
});

/**
 * Platform Experiment Tracking & A/B Testing Hub (Governance).
 * Specialized control matrix for monitoring conversion rate optimization and functional validation.
 */
export default function ExperimentConsolePage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <ExperimentConsoleClient />
      </Container>
    </main>
  );
}
