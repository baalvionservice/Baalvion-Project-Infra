import React from 'react';
import { Container } from '@/design-system/layout/container';
import { AlertsNotificationsClient } from './AlertsNotificationsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { Text } from '@/design-system/typography/text';

export const metadata: Metadata = buildMetadata({
  title: 'Alerts & Notifications | My Intelligence',
  description: 'Monitor your personal market triggers, price targets, and platform intelligence dispatches in real-time.',
});

/**
 * User Alerts & Notifications Page (Server Entry).
 * Provides a dedicated hub for managing personalized market monitoring and activity history.
 */
export default function UserAlertsPage() {
  return (
    <main className="min-h-screen bg-background pt-12">
      <Container>
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Bell className="h-5 w-5" />
            </div>
            <Text variant="label" className="font-bold tracking-widest text-primary">Intelligence Command</Text>
          </div>
          <Text variant="h1" className="text-4xl font-bold tracking-tight">Alerts & Notifications</Text>
          <Text variant="body" className="text-muted-foreground text-lg max-w-2xl mt-2">
            Configure precision triggers for your watched assets and stay synchronized with the global Imperialpedia intelligence loop.
          </Text>
        </header>

        <AlertsNotificationsClient />
      </Container>
    </main>
  );
}
