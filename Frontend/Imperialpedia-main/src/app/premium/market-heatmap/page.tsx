import React from 'react';
import { Container } from '@/design-system/layout/container';
import { MarketHeatmapClient } from './MarketHeatmapClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Market Heatmap | Institutional Analytics',
  description: 'Visualize global market sectors, asset performance, and institutional capital flows using real-time interactive heatmaps.',
});

/**
 * Institutional Market Heatmap Page (Server Entry).
 * Orchestrates the discovery of sector-wide trajectories and regional capital flows.
 */
export default function MarketHeatmapPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <MarketHeatmapClient />
      </Container>
    </main>
  );
}
