import React from 'react';
import { Container } from '@/design-system/layout/container';
import { PremiumDeepDiveClient } from './PremiumDeepDiveClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'AI Portfolio Deep-Dive | Pro Intelligence',
  description: 'Detailed audit of your investment nodes. Analyze structural imbalances, sector exposure, and AI-synthesized risk signals for the Imperialpedia Pro network.',
});

/**
 * AI Portfolio Deep Dive Page (Server Entry).
 * Orchestrates the discovery of complex portfolio analytics and risk mitigation strategies.
 */
export default function PremiumDeepDivePage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <PremiumDeepDiveClient />
      </Container>
    </main>
  );
}
