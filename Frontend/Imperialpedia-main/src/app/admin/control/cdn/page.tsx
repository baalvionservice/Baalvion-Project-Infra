import React from 'react';
import { Container } from '@/design-system/layout/container';
import { CdnManagementClient } from './CdnManagementClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'CDN & Cache Management | Governance',
  description: 'Orchestrate global content delivery, manage edge-level cache persistence, and monitor regional node performance for 1M+ programmatic nodes.',
});

/**
 * Platform CDN & Page Cache Management Hub (Governance).
 * Specialized control matrix for monitoring delivery performance and cache lifecycle.
 */
export default function CdnManagementPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <CdnManagementClient />
      </Container>
    </main>
  );
}
