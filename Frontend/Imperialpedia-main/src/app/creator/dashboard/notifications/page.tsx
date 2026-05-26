import React from 'react';
import { Container } from '@/design-system/layout/container';
import { getCreatorNotifications } from '@/services/mock-api/creators';
import { CreatorNotificationsClient } from './CreatorNotificationsClient';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildMetadata({
  title: 'Expert Activity Feed | Creator Studio',
  description: 'Monitor follower growth, content engagement, and platform announcements in real-time.',
});

/**
 * Creator Notifications Center (Server Entry).
 * Fetches initial activity items and renders the interactive notification suite.
 */
export default async function CreatorNotificationsPage() {
  const response = await getCreatorNotifications('u-1');
  const notifications = response.data;

  return (
    <main className="min-h-screen bg-background">
      <Container className="max-w-5xl pt-8">
        <CreatorNotificationsClient initialNotifications={notifications} />
      </Container>
    </main>
  );
}
