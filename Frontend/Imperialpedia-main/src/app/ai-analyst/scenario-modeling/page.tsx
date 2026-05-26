import React from 'react';
import { Container } from '@/design-system/layout/container';
import { ScenarioModelingClient } from './ScenarioModelingClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'AI Scenario Modeler | Dual-Case Intelligence',
  description: 'Generate side-by-side Bull and Bear scenarios for financial assets. Analyze key drivers, structural risks, and probability scores using institutional-grade AI modeling.',
});

/**
 * AI Scenario Modeler Page (Server Entry).
 * Orchestrates the discovery of dual-case intelligence nodes for balanced research.
 */
export default function AIScenarioModelingPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <ScenarioModelingClient />
      </Container>
    </main>
  );
}
