import React from 'react';
import { Container } from '@/design-system/layout/container';
import { premiumService } from '@/services/data/premium-service';
import { PremiumClient } from './PremiumClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Upgrade Your Intelligence | Premium Access',
  description: 'Select a premium tier to unlock advanced AI analyst tools, institutional-grade calculators, and real-time market oversight.',
});

/**
 * Premium Subscription Entry Page (Server Component).
 * Orchestrates the discovery of platform membership tiers.
 */
export default async function PremiumSubscriptionPage() {
  const response = await premiumService.getPremiumState();
  const state = response.data;

  if (!state) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Text variant="bodySmall" className="text-muted-foreground">Synchronizing subscription matrix...</Text>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container>
        <PremiumClient data={state} />
      </Container>
    </main>
  );
}

import { Text } from '@/design-system/typography/text';
