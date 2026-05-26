import React from 'react';
import { Container } from '@/design-system/layout/container';
import { AssetSummaryClient } from './AssetSummaryClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'AI Asset Summary Hub | Analyst Suite',
  description: 'Consolidated intelligence nodes for tracked financial assets. Real-time market metrics merged with AI-synthesized qualitative insights.',
});

/**
 * AI Asset Summary Page (Server Entry).
 * Orchestrates the discovery of consolidated intelligence for individual financial assets.
 */
export default function AIAssetSummaryPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <AssetSummaryClient />
      </Container>
    </main>
  );
}
