import React from 'react';
import { Container } from '@/design-system/layout/container';
import { LocalizationClient } from './LocalizationClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Multi-Language & Localization | Governance',
  description: 'Manage global platform dialects, orchestrate translatable knowledge nodes, and audit localized content for 1M+ programmatic pages.',
});

/**
 * Platform Multi-Language & Localization Hub (Governance).
 * Specialized control suite for managing international accessibility and dialect-specific sitemaps.
 */
export default function LocalizationManagementPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <LocalizationClient />
      </Container>
    </main>
  );
}
