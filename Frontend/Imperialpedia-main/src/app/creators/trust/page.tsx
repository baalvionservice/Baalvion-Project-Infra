import React from 'react';
import { Container } from '@/design-system/layout/container';
import { TrustDirectoryClient } from './TrustDirectoryClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Trusted Contributors Directory | Authority Matrix',
  description: 'Discover verified experts and high-trust financial analysts. Audit contributor credibility using real-time trust scores and verification milestones.',
});

/**
 * Trusted Contributors Directory Hub (Server Entry).
 * Orchestrates the discovery of verified authority nodes within the expert network.
 */
export default function TrustedContributorsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <TrustDirectoryClient />
      </Container>
    </main>
  );
}
