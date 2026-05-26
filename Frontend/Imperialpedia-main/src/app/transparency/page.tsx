import React from 'react';
import { Container } from '@/design-system/layout/container';
import { TransparencyClient } from './TransparencyClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Platform Transparency Hub | Governance & Trust',
  description: 'Explore the Imperialpedia transparency index. Audit platform moderation statistics, editorial activity, and community governance data in real-time.',
});

/**
 * Public Platform Transparency Page (Server Entry).
 * Orchestrates the discovery of governance data and institutional-grade trust metrics.
 */
export default function PlatformTransparencyPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <TransparencyClient />
      </Container>
    </main>
  );
}
