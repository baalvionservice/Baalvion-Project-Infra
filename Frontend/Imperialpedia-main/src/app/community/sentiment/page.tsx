import React from 'react';
import { Container } from '@/design-system/layout/container';
import { SentimentClient } from './SentimentClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Market Sentiment Pulse | Community Hub',
  description: 'Track real-time crowd perception for financial assets. Participate in Bull vs Bear voting and analyze sentiment drift across global market nodes.',
});

/**
 * Community Market Sentiment Page (Server Entry).
 * Orchestrates the discovery of crowd-sourced psychological indicators.
 */
export default function CommunitySentimentPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <SentimentClient />
      </Container>
    </main>
  );
}
