import React from 'react';
import { Container } from '@/design-system/layout/container';
import { EventIntelligenceClient } from './EventIntelligenceClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Event Intelligence Hub | Catalyst & Earnings Index',
  description: 'Monitor upcoming market catalysts and audit corporate earnings performance. Real-time EPS variance analysis and impact detection for 1M+ nodes.',
});

/**
 * AI Event Intelligence Page (Server Entry).
 * Orchestrates the discovery of market drivers and fiscal performance nodes.
 */
export default function AIEventIntelligencePage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <EventIntelligenceClient />
      </Container>
    </main>
  );
}
