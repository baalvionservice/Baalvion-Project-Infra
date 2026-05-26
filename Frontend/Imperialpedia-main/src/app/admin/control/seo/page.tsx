import React from 'react';
import { Container } from '@/design-system/layout/container';
import { SeoManagementClient } from './SeoManagementClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'SEO & Sitemap Orchestration | Governance',
  description: 'Manage organic discoverability, audit meta-descriptions, and visualize sitemap hierarchies for 1M+ programmatic nodes.',
});

/**
 * Platform SEO & Sitemap Hub (Governance).
 * Specialized control matrix for monitoring discovery performance and index integrity.
 */
export default function SeoManagementPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <SeoManagementClient />
      </Container>
    </main>
  );
}
