import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getCreatorVerificationStatus } from '@/services/mock-api/creators';
import { VerificationClient } from './VerificationClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Expert Authentication Hub | Imperialpedia',
  description: 'Manage your verified expert status and credentials for the Intelligence Index.',
});

/**
 * Expert Verification Page (Server Entry).
 * Fetches current verification lifecycle state and hands off to the interactive hub.
 */
export default async function ExpertVerificationPage() {
  // Mock fetching for Lead Expert Eleanor Vance (already verified in mock)
  // For standard user simulation, this would return 'unverified'
  const response = await getCreatorVerificationStatus('u-1');
  const verificationStatus = response.data;

  return (
    <main className="min-h-screen bg-background pt-8">
      <Container className="max-w-6xl">
        <VerificationClient initialStatus={verificationStatus} />
      </Container>
    </main>
  );
}
