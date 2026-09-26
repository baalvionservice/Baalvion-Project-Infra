import React from 'react';
import { Container } from '@/design-system/layout/container';
import { TransparencyClient } from './TransparencyClient';
import { systemService } from '@/services/data/system-service';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  canonical: '/transparency',
  title: 'Platform Transparency Hub | Governance & Trust',
  description: 'Explore the Imperialpedia transparency index. Audit platform moderation statistics, editorial activity, and community governance data in real-time.',
});

// This used to fetch client-side (see TransparencyClient's prior useEffect),
// which meant crawlers only ever saw a loading spinner in the raw HTML —
// confirmed live: real content never appeared without JS execution. Fetching
// here instead means the real metrics and policy links are in the initial
// server-rendered response, same as every other content route on this site.
export const revalidate = 3600;

/**
 * Public Platform Transparency Page (Server Entry).
 * Orchestrates the discovery of governance data and institutional-grade trust metrics.
 */
export default async function PlatformTransparencyPage() {
  const response = await systemService.getTransparencyData();
  const data = response.data ?? { metrics: { articles_published: 0, contributors: 0 }, policies: [] };

  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <TransparencyClient data={data} />
      </Container>
    </main>
  );
}
