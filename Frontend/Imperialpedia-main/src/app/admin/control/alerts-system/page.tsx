import React from 'react';
import { Container } from '@/design-system/layout/container';
import { AdvancedAlertsClient } from './AdvancedAlertsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Advanced Alerts & Notifications | Governance',
  description: 'Manage platform-wide alert rules, orchestrate notification delivery channels, and triage real-time infrastructure triggers.',
});

/**
 * Platform Advanced Alerts & Notification Hub (Governance).
 * Specialized control suite for managing instructional anomaly triggers and multi-channel dispatches.
 */
export default function AdvancedAlertsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <AdvancedAlertsClient />
      </Container>
    </main>
  );
}
