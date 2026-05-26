import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getCreatorSettings } from '@/services/mock-api/creators';
import { SettingsClient } from './SettingsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Expert Studio Settings | Imperialpedia',
  description: 'Customize your professional profile, manage security, and configure notification preferences for the Intelligence Index.',
});

/**
 * Creator Dashboard Settings Page (Server Entry).
 * Fetches expert-specific configuration and hands off to interactive client.
 */
export default async function CreatorSettingsPage() {
  // Mock fetching for Lead Expert Eleanor Vance
  const response = await getCreatorSettings('u-1');
  const settings = response.data;

  return (
    <main className="min-h-screen bg-background pt-8">
      <Container className="max-w-5xl">
        <SettingsClient initialSettings={settings} />
      </Container>
    </main>
  );
}
