import React from 'react';
import { Container } from '@/design-system/layout/container';
import { ScreenerClient } from './ScreenerClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Advanced Asset Screener | Pro Discovery Terminal',
  description: 'Powerful multi-vector screening for 1M+ financial assets. Build custom trading strategies, filter by institutional sentiment, and track momentum nodes.',
});

/**
 * Premium Asset Screener & Strategy Builder Page (Server Entry).
 * Orchestrates the discovery of institutional-grade market filtering and algorithmic logic.
 */
export default function PremiumScreenerPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <ScreenerClient />
      </Container>
    </main>
  );
}
